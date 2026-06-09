// nsiBundle fetches NSI structures inside the currently selected survey's
// perimeter and writes a stratified random sample of them onto the survey as
// survey.elements + survey.sampleSize. The fetched FeatureCollection is
// transient — it lives only inside the action and is not held in store state.
//
// The NSI endpoint is an external service, so we use plain fetch rather than
// apiPost (which would attach our internal Keycloak bearer token).
//
// survey.perimeterGeometry is a stringified bare GeoJSON geometry
// (Polygon or MultiPolygon) — the NSI API expects a FeatureCollection, so
// we wrap it before posting.
// Relative paths; the Vite dev server proxies /nsiapi to
// https://nsi.sec.usace.army.mil (see vite.config.js) to sidestep CORS. The
// same reverse-proxy mapping must exist in production deployments.
const NSI_BASE = import.meta.env.VITE_NSI_BASE || "";
const NSI_STRUCTURES_URL = `${NSI_BASE}/nsiapi/structures?fmt=fc`;
const NSI_STRUCTURE_URL = (fdId) =>
  `${NSI_BASE}/nsiapi/structure/${encodeURIComponent(fdId)}`;

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

// Strata labels here must match the rows rendered in generate-stratified-survey
// so survey.strataProportions keys line up with what the sampler assigns.
const strataLabel = (feature, useResidential, useFloodzone) => {
  const props = (feature && feature.properties) || {};
  const isResidential = residentialBucket(props.occtype) === "RES1";
  const inFloodzone = floodzoneBucket(props.firmzone) !== "OTHER";
  if (useResidential && useFloodzone) {
    if (isResidential && inFloodzone) return "Residential flood zone";
    if (isResidential) return "Residential no flood zone";
    if (inFloodzone) return "Floodzone no residential";
    return "Other";
  }
  if (useResidential) return isResidential ? "Residential" : "Other";
  if (useFloodzone) return inFloodzone ? "Floodzone" : "Other";
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

// Build the FeatureCollection POST body NSI expects from the survey's bare
// Polygon/MultiPolygon perimeter. MultiPolygons expand into one Feature per
// polygon.
const perimeterToFeatureCollection = (geometry) => {
  if (geometry.type === "Polygon") {
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry, properties: {} }],
    };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      type: "FeatureCollection",
      features: geometry.coordinates.map((coords) => ({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: coords },
        properties: {},
      })),
    };
  }
  throw new Error(`Unsupported perimeter geometry type: ${geometry.type}`);
};

// Stratify a FeatureCollection per the survey's residential/floodzone flags,
// compute a Cochran sample size per stratum from confidence/margin/proportion
// against each stratum's own population, and return survey.elements rows.
const stratifiedSampleFromFeatures = (features, survey) => {
  const useResidential = !!survey.residentialStratification;
  const useFloodzone = !!survey.floodzoneStratification;

  const byStratum = {};
  for (const f of features) {
    const label = strataLabel(f, useResidential, useFloodzone);
    (byStratum[label] = byStratum[label] || []).push(f);
  }
  const stratumSizes = Object.fromEntries(
    Object.entries(byStratum).map(([k, v]) => [k, v.length]),
  );
  // Each stratum gets its own Cochran sample size computed from that stratum's
  // population (with finite population correction). The overall sample is the
  // sum of these, so adding strata increases the total sample size. Each stratum
  // may carry its own proportion (survey.strataProportions[label]); when none is
  // set we fall back to the survey-wide survey.proportion.
  const strataProportions = survey.strataProportions || {};
  const allocation = Object.fromEntries(
    Object.entries(stratumSizes).map(([k, size]) => [
      k,
      cochranSampleSize(
        size,
        survey.confidence,
        survey.margin,
        strataProportions[k] ?? survey.proportion,
      ),
    ]),
  );

  const elements = [];
  for (const [label, bucket] of Object.entries(byStratum)) {
    const k = allocation[label] || 0;
    if (k <= 0) continue;
    const picks = shuffle(bucket.slice()).slice(0, k);
    for (const f of picks) {
      const fdId = f.properties && f.properties.fd_id;
      if (fdId == null) continue;
      elements.push({ fd_id: fdId, strata: label, control: false });
    }
  }
  // Control assignment is uniformly random across the entire sample (not
  // per-stratum) — shuffle indices and flip the first N to control=true.
  const pctControl = Number(survey.percentControlStructures) || 0;
  const numControl = Math.min(elements.length, Math.round(elements.length * pctControl));
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
  return elements;
};

const nsiBundle = {
  name: "nsi",
  getReducer: () => {
    const initialState = {
      fetching: false,
      error: null,
      // Monkey patch: cache of NSI features keyed by fd_id, populated by
      // doPrefetchNsiStructuresForSurvey. Lets doFetchNsiStructure serve
      // single-structure lookups out of memory while /nsiapi/structure/:fdId
      // is returning 500.
      structuresByFdId: {},
      prefetching: false,
      prefetchSurveyId: null,
      prefetchError: null,
    };
    return (state = initialState, { type, payload }) => {
      switch (type) {
        case "NSI_FETCH_START":
          return { ...state, fetching: true, error: null };
        case "NSI_FETCH_FINISH":
          return { ...state, fetching: false };
        case "NSI_FETCH_ERROR":
          return { ...state, fetching: false, error: payload };
        case "NSI_PREFETCH_START":
          return { ...state, prefetching: true, prefetchError: null, prefetchSurveyId: payload.surveyId };
        case "NSI_PREFETCH_FINISH":
          return { ...state, prefetching: false, structuresByFdId: payload.structuresByFdId, prefetchSurveyId: payload.surveyId };
        case "NSI_PREFETCH_ERROR":
          return { ...state, prefetching: false, prefetchError: payload };
        case "NSI_PREFETCH_CLEAR":
          return { ...state, structuresByFdId: {}, prefetchSurveyId: null, prefetchError: null };
      }
      return state;
    };
  },
  // Fetch NSI structures inside the survey perimeter, stratify them per the
  // survey settings, and write the resulting sample to survey.elements +
  // survey.sampleSize. The fetched FeatureCollection is not retained in state.
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
      try {
        const geometry = typeof raw === "string" ? JSON.parse(raw) : raw;
        body = perimeterToFeatureCollection(geometry);
      } catch (prepErr) {
        console.error("Failed to prepare NSI request body:", prepErr);
        dispatch({ type: "NSI_FETCH_ERROR", payload: prepErr.message });
        if (typeof onError === "function") onError(prepErr);
        return;
      }
      dispatch({ type: "NSI_FETCH_START" });
      fetch(NSI_STRUCTURES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((resp) => {
          if (!resp.ok) {
            throw new Error(`NSI request returned a ${resp.status}`);
          }
          return resp.json();
        })
        .then((fc) => {
          const features = (fc && fc.features) || [];
          // Re-read the survey in case it changed during the fetch.
          const current = store.selectSurvey();
          const elements = stratifiedSampleFromFeatures(features, current);
          store.doUpdateSurvey({
            ...current,
            elements,
            sampleSize: elements.length,
          });
          dispatch({ type: "NSI_FETCH_FINISH" });
          if (typeof onSuccess === "function") onSuccess(elements);
        })
        .catch((err) => {
          console.error("Failed to generate NSI stratified survey:", err);
          dispatch({ type: "NSI_FETCH_ERROR", payload: err.message });
          if (typeof onError === "function") onError(err);
        });
    },
  // Monkey patch for the 500ing /nsiapi/structure/:fdId endpoint: POST the
  // currently selected survey's perimeter to /nsiapi/structures?fmt=fc (the
  // bulk endpoint that still works), then index the returned FeatureCollection
  // by fd_id so doFetchNsiStructure can serve single-structure lookups from
  // memory. Safe to call repeatedly — re-running for the same survey simply
  // rebuilds the cache.
  doPrefetchNsiStructuresForSurvey:
    ({ onSuccess, onError } = {}) =>
    ({ dispatch, store }) => {
      const survey = store.selectSurvey();
      const surveyId = survey && survey.id;
      const raw = survey && survey.perimeterGeometry;
      if (!surveyId || !raw) {
        // Not an error — the perimeter may still be in flight; the caller
        // (doSelectSurvey) re-runs us once the perimeter resolves.
        return;
      }
      let body;
      try {
        const geometry = typeof raw === "string" ? JSON.parse(raw) : raw;
        body = perimeterToFeatureCollection(geometry);
      } catch (prepErr) {
        console.error("doPrefetchNsiStructuresForSurvey: bad perimeter:", prepErr);
        dispatch({ type: "NSI_PREFETCH_ERROR", payload: prepErr.message });
        if (typeof onError === "function") onError(prepErr);
        return;
      }
      dispatch({ type: "NSI_PREFETCH_START", payload: { surveyId } });
      fetch(NSI_STRUCTURES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((resp) => {
          if (!resp.ok) throw new Error(`NSI structures returned a ${resp.status}`);
          return resp.json();
        })
        .then((fc) => {
          const features = (fc && fc.features) || [];
          const structuresByFdId = {};
          for (const f of features) {
            const fdId = f && f.properties && f.properties.fd_id;
            if (fdId != null) structuresByFdId[String(fdId)] = f;
          }
          dispatch({
            type: "NSI_PREFETCH_FINISH",
            payload: { surveyId, structuresByFdId },
          });
          console.log(
            `doPrefetchNsiStructuresForSurvey: cached ${Object.keys(structuresByFdId).length} NSI structures for survey ${surveyId}`,
          );
          if (typeof onSuccess === "function") onSuccess(structuresByFdId);
        })
        .catch((err) => {
          console.error("doPrefetchNsiStructuresForSurvey failed:", err);
          dispatch({ type: "NSI_PREFETCH_ERROR", payload: err.message });
          if (typeof onError === "function") onError(err);
        });
    },
  // Look up a single NSI structure by fd_id. Hits the in-memory cache populated
  // by doPrefetchNsiStructuresForSurvey first; falls back to the live
  // /nsiapi/structure/:fdId endpoint on a miss (currently 500ing, but kept so
  // this still works once the endpoint is restored).
  doFetchNsiStructure:
    (fdId, { onSuccess, onError } = {}) =>
    ({ store }) => {
      if (fdId == null || fdId === "") {
        const err = new Error("doFetchNsiStructure requires an fd_id");
        console.error(err.message);
        if (typeof onError === "function") onError(err);
        return;
      }
      const cache = store.selectNsiStructures();
      const cached = cache && cache[String(fdId)];
      if (cached) {
        if (typeof onSuccess === "function") onSuccess(cached);
        return;
      }
      fetch(NSI_STRUCTURE_URL(fdId), { method: "GET" })
        .then((resp) => {
          if (!resp.ok) {
            throw new Error(`NSI structure ${fdId} returned a ${resp.status}`);
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
  selectNsiStructures: (state) => state.nsi.structuresByFdId,
  selectNsiPrefetching: (state) => state.nsi.prefetching,
};

export default nsiBundle;
