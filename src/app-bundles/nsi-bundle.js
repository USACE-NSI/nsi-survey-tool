// nsiBundle fetches NSI structures inside the currently selected survey's
// perimeter and writes a stratified random sample of them onto the survey as
// survey.elements + survey.sampleSize.
//
// Rather than buffer the whole inventory, we request the RFC 8142 feature
// stream (fmt=fs) and consume it record-by-record: each feature is binned into
// its stratum and then discarded, so peak memory is bounded by the reservoirs
// (a few hundred fd_ids per stratum) rather than by the polygon's structure
// count. This lets users run much larger perimeters without exhausting memory.
//
// The NSI endpoint is an external service, so we use plain fetch rather than
// apiPost (which would attach our internal Keycloak bearer token).
//
// survey.perimeterGeometry is a stringified bare GeoJSON geometry
// (Polygon or MultiPolygon). The NSI API only accepts a FeatureCollection
// holding a single Feature with a single Polygon, so before posting we wrap it
// and collapse any multi-part / multi-feature perimeter to its convex hull.
// Because the hull also covers the gaps between parts (and any holes), each
// streamed structure is then point-in-polygon tested against the original
// perimeter, so structures outside it are never counted or sampled.
// Relative paths; the Vite dev server proxies /nsiapi to
// https://nsi.sec.usace.army.mil (see vite.config.js) to sidestep CORS. The
// same reverse-proxy mapping must exist in production deployments, and it must
// stream the response through (e.g. nginx `proxy_buffering off;`) or the
// memory win is lost to proxy-side buffering.
const NSI_BASE = import.meta.env.VITE_NSI_BASE || "";
// The inventory source (e.g. nsi2022, nsi2026) is an optional path segment on
// the NSI API: /nsiapi/<source>/structures. When a survey has no source we omit
// it and the API serves its default inventory.
const NSI_STREAM_URL = (source) =>
  `${NSI_BASE}/nsiapi/${source ? `${encodeURIComponent(source)}/` : ""}structures?fmt=fs`;
// Single-structure lookup by fd_id. The fd_id is a path segment; the relative
// /nsiapi path is proxied to https://nsi.sec.usace.army.mil by the Vite dev
// server (see vite.config.js), which sidesteps CORS. So this resolves to
// /nsiapi/structures/fd_id/523367802 -> nsi.sec.usace.army.mil/nsiapi/structures/fd_id/523367802
const NSI_STRUCTURE_URL = (fdId, source) =>
  `${NSI_BASE}/nsiapi/${
    source ? `${encodeURIComponent(source)}/` : ""
  }structure/fd_id/${encodeURIComponent(fdId)}`;

// RFC 8142 record separator: each feature in the stream is prefixed by RS and
// terminated by a line feed.
const RECORD_SEPARATOR = "\x1e";
// Dispatch a progress update at most once per this many features so a multi-
// hundred-thousand structure stream doesn't flood the store with actions.
const PROGRESS_INTERVAL = 5000;

// Holds the AbortController for the in-flight stream so doCancel can stop it.
// Module-level (not store state) because an AbortController is not serializable.
let currentAbortController = null;

// z-scores for the confidence levels offered in the UI. Falls back to 1.96
// (95%) for any value not in the table so the math stays well-defined.
const Z_BY_CONFIDENCE = {
  0.8: 1.2816,
  0.9: 1.6449,
  0.95: 1.96,
};
const zScore = (confidence) => Z_BY_CONFIDENCE[Number(confidence)] ?? 1.96;

// Cochran's sample size for a proportion with finite population correction.
// n0 = z^2 * p * (1-p) / e^2 ; n = n0 / (1 + (n0 - 1)/N)
const cochranSampleSize = (population, confidence, margin, proportion) => {
  const z = zScore(confidence);
  const e = Number(margin);
  const p = Number(proportion);
  if (!population || !e || p <= 0 || p >= 1) return 0;
  const n0 = (z * z * p * (1 - p)) / (e * e);
  const n = n0 / (1 + (n0 - 1) / population);
  return Math.min(population, Math.ceil(n));
};

// The uncorrected Cochran sample size n0 = z^2 * p * (1-p) / e^2. Because the
// finite population correction only ever shrinks the sample (n <= n0 for all N),
// ceil(n0) is the largest sample any stratum can require regardless of its final
// population. We size each stratum's reservoir to this so a single streaming
// pass always retains enough candidates to draw the final sample.
const cochranN0 = (confidence, margin, proportion) => {
  const z = zScore(confidence);
  const e = Number(margin);
  const p = Number(proportion);
  if (!e || p <= 0 || p >= 1) return 0;
  return Math.ceil((z * z * p * (1 - p)) / (e * e));
};

// Residential bucket: split occtype on "-" and check the leading token.
const residentialBucket = (occtype) => {
  if (!occtype) return "OTHER";
  const head = String(occtype).split("-")[0].trim().toUpperCase();
  return head === "RES1" ? "RES1" : "OTHER";
};

// Floodzone bucket: A, V, or OTHER (covers blanks, X, AE, etc.).
const floodzoneBucket = (firmzone) => {
  if (!firmzone) return "OTHER";
  const f = String(firmzone).trim().toUpperCase();
  if (f === "A") return "A";
  if (f === "V") return "V";
  return "OTHER";
};

// Strata enum names. These are persisted to survey_element.strata (varchar(15)),
// so they must stay short, and they must match the rows rendered in
// generate-stratified-survey so survey.strataProportions keys line up with what
// the sampler assigns. Composed from the residential token (RES1/OTHER) and the
// collapsed floodzone token (FLD/OTHER).
const strataLabel = (feature, useResidential, useFloodzone) => {
  const props = (feature && feature.properties) || {};
  const resToken = residentialBucket(props.occtype) === "RES1" ? "RES1" : "OTHER";
  const fzToken = floodzoneBucket(props.firmzone) !== "OTHER" ? "FLD" : "OTHER";
  if (useResidential && useFloodzone) return `${resToken}_${fzToken}`;
  if (useResidential) return resToken;
  if (useFloodzone) return fzToken;
  return "ALL";
};

// In-place Fisher–Yates so we can take a uniform random sample of size k.
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Recursively collect every [x, y] position out of a GeoJSON geometry's nested
// coordinate arrays (works for Polygon, MultiPolygon, and GeometryCollection).
const collectPositions = (geometry, out) => {
  if (!geometry) return out;
  if (geometry.type === "GeometryCollection") {
    (geometry.geometries || []).forEach((g) => collectPositions(g, out));
    return out;
  }
  const walk = (node) => {
    if (Array.isArray(node) && typeof node[0] === "number") {
      out.push(node);
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    }
  };
  walk(geometry.coordinates);
  return out;
};

// Andrew's monotone chain convex hull. Takes [x, y] points and returns a
// closed, counter-clockwise ring (first point repeated at the end) suitable as
// a GeoJSON Polygon's exterior ring.
const convexHull = (points) => {
  const sorted = points
    .map((p) => [p[0], p[1]])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const pts = sorted.filter(
    (p, i) => i === 0 || p[0] !== sorted[i - 1][0] || p[1] !== sorted[i - 1][1],
  );
  if (pts.length < 3) {
    throw new Error("Perimeter has too few distinct points for a convex hull");
  }
  const cross = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (input) => {
    const stack = [];
    for (const p of input) {
      while (
        stack.length >= 2 &&
        cross(stack[stack.length - 2], stack[stack.length - 1], p) <= 0
      ) {
        stack.pop();
      }
      stack.push(p);
    }
    stack.pop(); // drop the last point; it's the first point of the other half
    return stack;
  };
  const hull = half(pts).concat(half(pts.slice().reverse()));
  hull.push(hull[0]); // close the ring
  return hull;
};

// Flatten arbitrary GeoJSON into a list of Polygon ring-sets (each entry is
// [exteriorRing, ...holeRings]), descending through Feature, FeatureCollection,
// and GeometryCollection wrappers.
const collectPolygons = (geojson, out) => {
  if (!geojson) return out;
  switch (geojson.type) {
    case "FeatureCollection":
      (geojson.features || []).forEach((f) => collectPolygons(f, out));
      break;
    case "Feature":
      collectPolygons(geojson.geometry, out);
      break;
    case "GeometryCollection":
      (geojson.geometries || []).forEach((g) => collectPolygons(g, out));
      break;
    case "Polygon":
      out.push(geojson.coordinates);
      break;
    case "MultiPolygon":
      geojson.coordinates.forEach((rings) => out.push(rings));
      break;
  }
  return out;
};

// Pull the [lon, lat] location out of a streamed NSI structure feature. The
// fmt=fs stream carries a Point geometry; we fall back to the x/y properties.
const featurePoint = (feature) => {
  const g = feature && feature.geometry;
  if (g && g.type === "Point" && Array.isArray(g.coordinates)) {
    return g.coordinates;
  }
  const p = (feature && feature.properties) || {};
  if (Number.isFinite(p.x) && Number.isFinite(p.y)) return [p.x, p.y];
  return null;
};

// Ray-casting point-in-ring test. ring is an array of [x, y]; the closing
// point being present or not doesn't matter.
const pointInRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

// True when [x, y] falls inside any of the polygons — inside an exterior ring
// and outside that polygon's holes.
const pointInPolygons = (x, y, polygons) =>
  polygons.some(
    (rings) =>
      pointInRing(x, y, rings[0]) &&
      !rings.slice(1).some((hole) => pointInRing(x, y, hole)),
  );

// Build the NSI request from the survey's perimeter GeoJSON. NSI only accepts a
// FeatureCollection holding one Feature with one Polygon, so:
//   - a lone Polygon is posted unchanged (holes and all) and needs no filtering
//   - anything multi-part (MultiPolygon or several features) is posted as the
//     convex hull of every part — the tightest single polygon still enclosing
//     the whole perimeter — and we return a `withinPerimeter` predicate so the
//     caller can discard structures NSI returns from the gaps and holes the
//     hull spans but the true perimeter excludes.
// Returns { body, withinPerimeter }; withinPerimeter is null when the posted
// polygon already matches the perimeter exactly.
const buildNsiRequest = (geojson) => {
  let geometries;
  if (geojson.type === "FeatureCollection") {
    geometries = (geojson.features || [])
      .map((f) => f && f.geometry)
      .filter(Boolean);
  } else if (geojson.type === "Feature") {
    geometries = geojson.geometry ? [geojson.geometry] : [];
  } else {
    geometries = [geojson];
  }
  if (geometries.length === 0) {
    throw new Error("Perimeter GeoJSON contains no geometry");
  }
  const wrap = (geometry) => ({
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry, properties: {} }],
  });
  if (geometries.length === 1 && geometries[0].type === "Polygon") {
    return { body: wrap(geometries[0]), withinPerimeter: null };
  }
  const positions = geometries.reduce((acc, g) => collectPositions(g, acc), []);
  const hull = { type: "Polygon", coordinates: [convexHull(positions)] };
  const polygons = collectPolygons(geojson, []);
  return {
    body: wrap(hull),
    withinPerimeter: (x, y) => pointInPolygons(x, y, polygons),
  };
};

// Streaming stratified sampler. Build one of these per generate run, feed it
// features one at a time via add() as they arrive on the stream, then call
// finalize() once the stream ends to draw the sample.
//
// For each stratum we keep only a running population count and a bounded
// reservoir of candidate fd_ids (capped at ceil(n0) — the largest sample that
// stratum could ever need). add() uses Algorithm R reservoir sampling so the
// reservoir is always a uniform random sample of the fd_ids seen so far, which
// means we never hold the full inventory in memory. finalize() computes the
// finite-population-corrected Cochran sample size from each stratum's final
// population and draws that many from the reservoir.
//
// Strata, proportions, and statistical parameters are captured from the survey
// at construction time so they stay consistent for the whole stream even if the
// user edits the form mid-run.
const createStratifiedReservoir = (survey) => {
  const useResidential = !!survey.residentialStratification;
  const useFloodzone = !!survey.floodzoneStratification;
  const strataProportions = survey.strataProportions || {};
  // Each stratum may carry its own proportion (survey.strataProportions[label]);
  // when none is set we fall back to survey.defaultProportion (UI-only default;
  // not persisted).
  const propFor = (label) => strataProportions[label] ?? survey.defaultProportion;

  // label -> { population, seen, cap, reservoir }
  // population: every feature in the stratum (drives Cochran).
  // seen: fd_id-bearing features (drives reservoir indexing).
  const strata = {};

  const add = (feature) => {
    const label = strataLabel(feature, useResidential, useFloodzone);
    let s = strata[label];
    if (!s) {
      s = strata[label] = {
        population: 0,
        seen: 0,
        cap: cochranN0(survey.confidence, survey.margin, propFor(label)),
        reservoir: [],
      };
    }
    s.population += 1;
    const fdId = feature.properties && feature.properties.fd_id;
    if (fdId == null || s.cap <= 0) return;
    s.seen += 1;
    if (s.reservoir.length < s.cap) {
      s.reservoir.push(fdId);
    } else {
      // Algorithm R: replace a random slot with probability cap/seen.
      const j = Math.floor(Math.random() * s.seen);
      if (j < s.cap) s.reservoir[j] = fdId;
    }
  };

  const finalize = () => {
    const allocation = {};
    const elements = [];
    for (const [label, s] of Object.entries(strata)) {
      const k = cochranSampleSize(
        s.population,
        survey.confidence,
        survey.margin,
        propFor(label),
      );
      allocation[label] = k;
      if (k <= 0) continue;
      const picks = shuffle(s.reservoir.slice()).slice(0, k);
      for (const fdId of picks) {
        elements.push({ fd_id: fdId, strata: label, control: false });
      }
    }
    // Control assignment is uniformly random across the entire sample (not
    // per-stratum) — shuffle indices and flip the first N to control=true.
    const pctControl = Number(survey.percentControlStructures) || 0;
    const numControl = Math.min(
      elements.length,
      Math.round(elements.length * pctControl),
    );
    if (numControl > 0) {
      const indices = elements.map((_, i) => i);
      shuffle(indices);
      for (let i = 0; i < numControl; i++) {
        elements[indices[i]].control = true;
      }
    }
    // Post-process: the first 10 elements are always control, on top of whatever
    // the user's percent-based assignment selected above.
    const forcedControl = Math.min(elements.length, 10);
    for (let i = 0; i < forcedControl; i++) {
      elements[i].control = true;
    }
    return { elements, strataSampleSizes: allocation };
  };

  return { add, finalize };
};

const nsiBundle = {
  name: "nsi",
  getReducer: () => {
    const initialState = {
      fetching: false,
      error: null,
      // processed: features binned so far on the in-flight stream.
      // startedAt: epoch ms when the current stream began (for elapsed time).
      processed: 0,
      startedAt: null,
    };
    return (state = initialState, { type, payload }) => {
      switch (type) {
        case "NSI_FETCH_START":
          return {
            ...state,
            fetching: true,
            error: null,
            processed: 0,
            startedAt: Date.now(),
          };
        case "NSI_FETCH_PROGRESS":
          return { ...state, processed: payload };
        case "NSI_FETCH_FINISH":
          return { ...state, fetching: false };
        case "NSI_FETCH_CANCEL":
          return { ...state, fetching: false };
        case "NSI_FETCH_ERROR":
          return { ...state, fetching: false, error: payload };
      }
      return state;
    };
  },
  // Stream NSI structures inside the survey perimeter, stratify them as they
  // arrive, and write the resulting sample to survey.elements + survey.sampleSize.
  // Features are binned and discarded record-by-record, so the full inventory is
  // never held in memory. Progress is reported via NSI_FETCH_PROGRESS, and the
  // run can be aborted with doCancelNsiStratifiedSurvey.
  doGenerateNsiStratifiedSurvey:
    ({ onSuccess, onError } = {}) =>
    ({ dispatch, store }) => {
      const survey = store.selectSurvey();
      const raw = survey && survey.perimeterGeometry;
      if (!raw) {
        const err = new Error(
          "doGenerateNsiStratifiedSurvey requires survey.perimeterGeometry",
        );
        console.error(err.message);
        dispatch({ type: "NSI_FETCH_ERROR", payload: err.message });
        if (typeof onError === "function") onError(err);
        return;
      }
      let body;
      let withinPerimeter;
      try {
        const geometry = typeof raw === "string" ? JSON.parse(raw) : raw;
        ({ body, withinPerimeter } = buildNsiRequest(geometry));
      } catch (prepErr) {
        console.error("Failed to prepare NSI request body:", prepErr);
        dispatch({ type: "NSI_FETCH_ERROR", payload: prepErr.message });
        if (typeof onError === "function") onError(prepErr);
        return;
      }

      const controller = new AbortController();
      currentAbortController = controller;
      dispatch({ type: "NSI_FETCH_START" });

      const reservoir = createStratifiedReservoir(survey);
      let processed = 0;
      let lastDispatched = 0;

      // Parse one RFC 8142 record (RS-delimited; may carry a trailing LF) and
      // feed it to the reservoir. Malformed records are skipped rather than
      // aborting the whole stream. When the perimeter was collapsed to a hull
      // for the request, withinPerimeter drops structures that fall outside the
      // user's true (multi-part / holed) perimeter so they're never counted in
      // the population or sampled.
      const handleRecord = (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        let feature;
        try {
          feature = JSON.parse(trimmed);
        } catch {
          return;
        }
        if (withinPerimeter) {
          const point = featurePoint(feature);
          if (!point || !withinPerimeter(point[0], point[1])) return;
        }
        reservoir.add(feature);
        processed += 1;
        if (processed - lastDispatched >= PROGRESS_INTERVAL) {
          lastDispatched = processed;
          dispatch({ type: "NSI_FETCH_PROGRESS", payload: processed });
        }
      };

      (async () => {
        try {
          const resp = await fetch(NSI_STREAM_URL(survey.inventorySource), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          if (!resp.ok) {
            throw new Error(`NSI request returned a ${resp.status}`);
          }
          if (!resp.body) {
            throw new Error("NSI stream response has no readable body");
          }

          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buf.indexOf(RECORD_SEPARATOR)) !== -1) {
              handleRecord(buf.slice(0, idx));
              buf = buf.slice(idx + 1);
            }
          }
          // Flush any bytes the decoder was holding, then drain the buffer —
          // the final record carries no trailing separator.
          buf += decoder.decode();
          let idx;
          while ((idx = buf.indexOf(RECORD_SEPARATOR)) !== -1) {
            handleRecord(buf.slice(0, idx));
            buf = buf.slice(idx + 1);
          }
          handleRecord(buf);

          const { elements, strataSampleSizes } = reservoir.finalize();
          // Re-read the survey in case it changed during the stream.
          const current = store.selectSurvey();
          store.doUpdateSurvey({
            ...current,
            elements,
            sampleSize: elements.length,
            strataSampleSizes,
          });
          dispatch({ type: "NSI_FETCH_PROGRESS", payload: processed });
          dispatch({ type: "NSI_FETCH_FINISH" });
          if (typeof onSuccess === "function") onSuccess(elements);
        } catch (err) {
          if (err && err.name === "AbortError") {
            dispatch({ type: "NSI_FETCH_CANCEL" });
            return;
          }
          console.error("Failed to generate NSI stratified survey:", err);
          dispatch({ type: "NSI_FETCH_ERROR", payload: err.message });
          if (typeof onError === "function") onError(err);
        } finally {
          if (currentAbortController === controller) {
            currentAbortController = null;
          }
        }
      })();
    },
  // Abort the in-flight stratified-survey stream, if any. The fetch's catch
  // turns the resulting AbortError into NSI_FETCH_CANCEL.
  doCancelNsiStratifiedSurvey:
    () =>
    () => {
      if (currentAbortController) currentAbortController.abort();
    },
  // Look up a single NSI structure by fd_id from /nsiapi/structures/:fd_id.
  // Each survey element is fetched on demand as it is opened, so a survey never
  // holds more than the structures actually being viewed in memory.
  doFetchNsiStructure:
    (fdId, { onSuccess, onError } = {}) =>
    ({ store }) => {
      if (fdId == null || fdId === "") {
        const err = new Error("doFetchNsiStructure requires an fd_id");
        console.error(err.message);
        if (typeof onError === "function") onError(err);
        return;
      }
      const survey = store.selectSurvey();
      const source = survey && survey.inventorySource;
      fetch(NSI_STRUCTURE_URL(fdId, source), { method: "GET" })
        .then((resp) => {
          if (!resp.ok) {
            // Attach the HTTP status (and the source) to the error so callers can
            // tell "this fd_id isn't in the inventory" (404) apart from a
            // transient backend failure (5xx) and message the surveyor accordingly.
            const err = new Error(`NSI structure ${fdId} returned a ${resp.status}`);
            err.status = resp.status;
            err.fdId = fdId;
            err.source = source || null;
            throw err;
          }
          return resp.json();
        })
        .then((json) => {
          if (typeof onSuccess === "function") onSuccess(json);
        })
        .catch((err) => {
          console.error(`Failed to fetch NSI structure ${fdId}:`, err);
          if (typeof onError === "function") onError(err);
        });
    },
  selectNsi: (state) => state.nsi,
  selectNsiFetching: (state) => state.nsi.fetching,
  selectNsiError: (state) => state.nsi.error,
  selectNsiProcessed: (state) => state.nsi.processed,
  selectNsiStartedAt: (state) => state.nsi.startedAt,
};

export default nsiBundle;
