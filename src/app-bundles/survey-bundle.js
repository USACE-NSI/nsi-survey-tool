//the surveyBundle manages state for a given survey.  The selectSurvey is one of the most used selectors in this program. doUpdateSurvey is probably the next most used.
//@TODO make api call to create new surveys? make api call to post a survey or edits to a survey.
//@TODO add an api call to post surveyElements from csv.
import Papa from "papaparse";
//a function to generate a guid. this could be a database behavior in the future. i needed it for identification of unique surveys in lists so i had to do something in the interum.
function generateGuid() {
  var d = new Date().getTime(); // Timestamp
  var d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; // High-res timestamp
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16; // Random number between 0 and 16
    if (d > 0) {
      // Use timestamp entropy
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      // Use high-res timestamp entropy (maybe more unique than rand in some cases)
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}


const surveyBundle = {
    name: 'survey',
    getReducer: () => {
      const initialState = {
        id: generateGuid(),
        name: "davis",
        description: "description",
         dueDate: "2028-12-12",
         owners: [],
         members: [],
         completed: false,
         createStratifiedSurvey: false,
         inventorySource: "2022",
         residentialStratification: false,
         floodzoneStratification: false,
         confidence: 0.95,
         margin: 0.05,
         defaultProportion: 0.50,
         sampleSize: 0,
         // Per-stratum sample sizes (label -> count) computed when the user
         // clicks "Generate Stratified Survey". UI-only (not persisted); strata
         // without an entry render as 0. See doGenerateNsiStratifiedSurvey.
         strataSampleSizes: {},
         percentControlStructures: 0.01,
         perimeterGeometry: null,//stringified GeoJSON (EPSG:4326) uploaded via UploadPolygon; posted as perimeter_geom on the server Survey struct.
         elements: [],//for loading and validating... i do not think this list of elements should be in memory for long ideally we would validate and post to the database. @TODO address this.
         percentComplete:0.00,
         results:[]//for display in charts... i do not think this will be preserved in memory so clearing this when the user leaves results viewing would be good. or supporting the specific calls for results via the api would be nice @TODO address this.
        };
      return (state = initialState, { type, payload }) => {
        switch(type){
            case "UPDATE_SURVEY":
                return {...state, ...payload}
        }
        return state;
      };
    },
    doCreateNewSurvey: () => ({dispatch}) =>{
      const initialState = {
        id: generateGuid(),
        // Not yet persisted server-side: member edits are staged in state until create.
        isNew: true,
        name: "",
        description: "",
         dueDate: "2028-12-12",
         owners: [],
         members: [],
         completed: false,
         createStratifiedSurvey: false,
         inventorySource: "2022",
         residentialStratification: false,
         floodzoneStratification: false,
         confidence: 0.95,
         margin: 0.05,
         defaultProportion: 0.50,
         sampleSize: 0,
         // Per-stratum sample sizes (label -> count) computed when the user
         // clicks "Generate Stratified Survey". UI-only (not persisted); strata
         // without an entry render as 0. See doGenerateNsiStratifiedSurvey.
         strataSampleSizes: {},
         percentControlStructures: 0.01,
         perimeterGeometry: null,
         elements: [],
         percentComplete:0.00,
         results:[]//for display in charts...
        };
        dispatch({
          type: "UPDATE_SURVEY",
          payload: initialState
        });
    },
    //this is called all over the place, it is updating the state - should not be used for posting to database via the api. we should make a separate action to post.
    //@TODO add an action to post the survey to the database.
    doUpdateSurvey: (state) => ({dispatch})=>{
        console.log("dispatching " + state)
        dispatch({
            type: "UPDATE_SURVEY",
            payload: state
          });
    },
    //Load a survey from the active/completed list into the survey bundle and fetch its perimeter geometry. The list rows intentionally don't carry geometry, so we hit /api/survey/:surveyid/perimeter and merge perimeter_geom -> perimeterGeometry once it returns. Also pushes the perimeter into the map bundle so the map page can render it as a layer and fit the view. Each survey element's NSI structure is loaded on demand by doAutofillFromNsi via /nsiapi/structures/:fd_id as the element is opened. Use this anywhere a user "opens" a survey.
    // opts.autoAdvance: once the perimeter has loaded, automatically load the
    // first assignment (NEXT). Each element's NSI structure is fetched on demand
    // by doAutofillFromNsi via /nsiapi/structures/:fd_id, so there is nothing to
    // pre-warm. Used by "View Survey" so the surveyor lands on the first element.
    doSelectSurvey: (surveyData, opts = {}) => ({ dispatch, apiGet, store }) => {
      if (!surveyData || !surveyData.id) return;
      // Clear the previously surveyed element so the tray starts empty/locked
      // for the newly selected survey.
      if (store && store.doSurveyResetElement) store.doSurveyResetElement();
      // When auto-advancing, mark the element loading up front so the tray's
      // entry form stays disabled through the perimeter + NEXT chain
      // (which can take several seconds for large study areas).
      if (opts.autoAdvance) {
        dispatch({ type: "SURVEY_LOADED", payload: { surveyElement: { isLoading: true } } });
      }
      // Clear any stale geometry and NSI cache from a previously selected survey while the fetch is in flight.
      // This survey exists server-side, so isNew is false — member edits persist immediately.
      dispatch({
        type: "UPDATE_SURVEY",
        payload: { ...surveyData, perimeterGeometry: null, isNew: false },
      });
      if (store && store.doSetMapPerimeter) store.doSetMapPerimeter(null);
      apiGet(`/api/survey/${surveyData.id}/perimeter`, (err, body) => {
        if (err) {
          console.error(`Failed to fetch perimeter for survey ${surveyData.id}:`, err);
          // No perimeter loaded, but the assignment can still load — each
          // element's structure is fetched on demand. Advance and clear the
          // up-front loading flag we set above.
          if (opts.autoAdvance && store && store.doSurveyFetchNext) {
            store.doSurveyFetchNext();
          }
          return;
        }
        const perimeterGeometry = body && body.perimeter_geom ? body.perimeter_geom : null;
        dispatch({ type: "UPDATE_SURVEY", payload: { perimeterGeometry } });
        if (store && store.doSetMapPerimeter) store.doSetMapPerimeter(perimeterGeometry);
        // Structures are fetched per element on demand, so nothing to pre-warm —
        // advance straight to the first assignment.
        if (opts.autoAdvance && store && store.doSurveyFetchNext) {
          store.doSurveyFetchNext();
        }
      });
    },
    //Fetch the survey report from /api/survey/:surveyid/report (server handler GetSurveyReport) and merge the rows onto survey.results so the charts/table on /results render server data instead of a CSV upload. The server returns text/csv (not JSON), so apiGet — which always calls response.json() — would drop the body; this uses apiFetch to grab the raw response and Papa to parse it. The server header `reconstructionType` is stored as-is and consumed by view-results-table/-bar/-pie/-boxplot/-distribution.
    doFetchSurveyResults: (surveyId) => ({ dispatch, apiFetch, store }) => {
      const targetId = surveyId || (store.selectSurvey() && store.selectSurvey().id);
      if (!targetId) {
        console.warn("doFetchSurveyResults: no surveyId");
        return;
      }
      apiFetch(`/api/survey/${targetId}/report`)
        .then((resp) => {
          if (!resp.ok) throw new Error(`report fetch returned ${resp.status}`);
          return resp.text();
        })
        .then((csv) => {
          const toBool = (val) => {
            if (typeof val === "boolean") return val;
            if (val === undefined || val === null) return false;
            const s = String(val).toLowerCase().trim();
            return ["true", "1", "yes", "t", "y"].includes(s);
          };
          const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
          const results = (parsed.data || []).map((row) => ({
            srId: row.srId,
            userId: row.userId,
            userName: row.userName,
            completed: toBool(row.completed),
            isControl: toBool(row.isControl),
            saId: row.saId,
            fdId: row.fdId,
            x: row.x,
            y: row.y,
            invalidStructure: toBool(row.invalidStructure),
            noStreetView: toBool(row.noStreetView),
            cbfips: row.cbfips,
            occtype: row.occtype,
            stDamcat: row.stDamcat,
            foundHt: row.foundHt,
            numStory: row.numStory,
            sqft: row.sqft,
            foundType: row.foundType,
            reconstructionType: row.reconstructionType,
            quality: row.quality,
            constType: row.constType,
            garage: row.garage,
            roofStyle: row.roofStyle,
          }));
          dispatch({ type: "UPDATE_SURVEY", payload: { results } });
        })
        .catch((err) => {
          console.error(`Failed to fetch results for survey ${targetId}:`, err);
        });
    },
    //Fetch the survey's full roster (with owner flags) from /api/survey/:surveyid/members
    // (server handler GetSurveyMembers, owner/admin only) and merge members + owners
    // onto the selected survey so the manage screen's member table can list and edit
    // them. The active/completed lists only carry owners (from the public /owners
    // endpoint), so the editable roster is loaded here when an owner opens manage.
    doFetchSurveyMembers: (surveyId) => ({ dispatch, apiGet, store }) => {
      const targetId = surveyId || (store.selectSurvey() && store.selectSurvey().id);
      if (!targetId) return;
      apiGet(`/api/survey/${targetId}/members`, (err, body) => {
        if (err) {
          console.error(`Failed to fetch members for survey ${targetId}:`, err);
          return;
        }
        const all = Array.isArray(body) ? body : [];
        const members = all.map((m) => m.userName);
        const owners = all.filter((m) => m.isOwner).map((m) => m.userName);
        dispatch({ type: "UPDATE_SURVEY", payload: { members, owners } });
      });
    },
    //Fetch survey elements for a given surveyId and merge them onto the currently selected survey. Used when opening manage so the elements list is hydrated after a reload.
    doFetchSurveyElements: (surveyId) => ({ dispatch, apiGet }) => {
      if (!surveyId) return;
      apiGet(`/api/survey/${surveyId}/elements`, (err, body) => {
        if (err) {
          console.error(`Failed to fetch elements for survey ${surveyId}:`, err);
          return;
        }
        const elements = Array.isArray(body) ? body : [];
        dispatch({ type: "UPDATE_SURVEY", payload: { elements } });
      });
    },
    // Re-derive completedCount/totalCount for the currently selected survey and
    // merge them onto the survey so the tray's progress readout reflects the
    // latest server state. Backed by the dedicated GET /api/survey/:id/progress
    // endpoint (server handler GetSurveyProgress), which returns the survey-wide
    // deduped completed element count over the survey's total element count in a
    // single round trip — no longer pulling/parsing the entire report CSV.
    doRefreshSurveyProgress: (surveyId) => ({ dispatch, apiGet, store }) => {
      const targetId = surveyId || (store.selectSurvey() && store.selectSurvey().id);
      if (!targetId) {
        console.warn("doRefreshSurveyProgress: no surveyId");
        return;
      }
      apiGet(`/api/survey/${targetId}/progress`, (err, body) => {
        if (err) {
          console.error(`doRefreshSurveyProgress: failed to fetch progress for survey ${targetId}:`, err);
          return;
        }
        const total = body && typeof body.total === "number" ? body.total : 0;
        const completed = body && typeof body.completed === "number" ? body.completed : 0;
        const percentComplete = total > 0 ? Math.min(1, completed / total) : 0;
        dispatch({
          type: "UPDATE_SURVEY",
          payload: { completedCount: completed, totalCount: total, percentComplete },
        });
      });
    },
    // Begin a brand-new survey: a fresh client GUID and isNew=true. isNew is the
    // bundle's record that the survey does not exist server-side yet, so member
    // changes must be staged in state (see doUpsertSurveyMember/doRemoveMemberFromSurvey)
    // rather than POSTed to /api/survey/:id/member — that endpoint 401s until the
    // survey exists and the caller is one of its owners. doPostNewSurvey clears the
    // flag and persists the staged roster once the survey is created.
    doUpdateSurveyGUID: () => ({dispatch})=>{
        console.log("dispatching update guid")
        dispatch({
            type: "UPDATE_SURVEY",
            payload: {id:generateGuid(), isNew: true}
          });
    }
    ,
    //POST (upsert) a survey member at /api/survey/:surveyid/member. Resolves the username to a userId against the loaded roster, then persists the membership (and owner flag) server-side so surveyors added to an existing survey actually get a survey_member row — otherwise the server's per-user /api/surveys query never returns the survey to them. The endpoint is an upsert keyed on (survey_id, user_id), so this also handles toggling the owner flag on an existing member. On success the in-memory survey's members/owners are updated to match.
    doUpsertSurveyMember: (userName, isOwner = false, { onSuccess, onError } = {}) => ({ dispatch, apiPost, store }) => {
      const survey = store.selectSurvey();
      const surveyId = survey && survey.id;
      if (!surveyId || !userName) {
        const err = new Error("doUpsertSurveyMember requires a surveyId and userName");
        console.error(err.message);
        if (typeof onError === "function") onError(err);
        return;
      }
      // Unsaved survey: stage the membership/owner flag in state only. The full
      // roster is persisted by doPostNewSurvey after the survey exists server-side.
      if (survey.isNew) {
        const members = (survey.members || []).includes(userName)
          ? survey.members
          : [...(survey.members || []), userName];
        const currentOwners = survey.owners || [];
        const owners = isOwner
          ? (currentOwners.includes(userName) ? currentOwners : [...currentOwners, userName])
          : currentOwners.filter((o) => o !== userName);
        dispatch({ type: "UPDATE_SURVEY", payload: { members, owners } });
        if (typeof onSuccess === "function") onSuccess();
        return;
      }
      const roster = (store.selectMembers && store.selectMembers().list) || [];
      const match = roster.find((u) => u.userName === userName);
      const userId = match && match.userId;
      if (!userId) {
        const err = new Error(`No userId in roster for ${userName}`);
        console.error(err.message);
        if (typeof onError === "function") onError(err);
        return;
      }
      apiPost(`/api/survey/${surveyId}/member`, { surveyId, userId, isOwner }, (err) => {
        if (err) {
          console.error(`Failed to upsert member ${userName} on survey ${surveyId}:`, err);
          if (typeof onError === "function") onError(err);
          return;
        }
        const members = (survey.members || []).includes(userName)
          ? survey.members
          : [...(survey.members || []), userName];
        const currentOwners = survey.owners || [];
        const owners = isOwner
          ? (currentOwners.includes(userName) ? currentOwners : [...currentOwners, userName])
          : currentOwners.filter((o) => o !== userName);
        dispatch({ type: "UPDATE_SURVEY", payload: { members, owners } });
        // Refresh the owners on the active/completed list rows so the "Owners:"
        // label and owner-only manage controls reflect the change immediately.
        dispatch({ type: "SURVEY_OWNERS_UPDATED", payload: { surveyId, owners } });
        if (typeof onSuccess === "function") onSuccess(userId);
      });
    },
    //DELETE the member from a survey at /api/survey/:surveyid/member/:memberid. Resolves the username to a userId against the loaded roster; on success removes the member (and any matching owner entry) from the in-memory survey.
    doRemoveMemberFromSurvey: (userName, { onSuccess, onError } = {}) => ({ dispatch, apiDelete, store }) => {
      const survey = store.selectSurvey();
      const surveyId = survey && survey.id;
      if (!surveyId || !userName) {
        const err = new Error("doRemoveMemberFromSurvey requires a surveyId and userName");
        console.error(err.message);
        if (typeof onError === "function") onError(err);
        return;
      }
      // Unsaved survey: there is no server-side row to delete; just drop it from state.
      if (survey.isNew) {
        dispatch({
          type: "UPDATE_SURVEY",
          payload: {
            members: (survey.members || []).filter((m) => m !== userName),
            owners: (survey.owners || []).filter((o) => o !== userName),
          },
        });
        if (typeof onSuccess === "function") onSuccess();
        return;
      }
      const roster = (store.selectMembers && store.selectMembers().list) || [];
      const match = roster.find((u) => u.userName === userName);
      const userId = match && match.userId;
      if (!userId) {
        const err = new Error(`No userId in roster for ${userName}`);
        console.error(err.message);
        if (typeof onError === "function") onError(err);
        return;
      }
      apiDelete(`/api/survey/${surveyId}/member/${userId}`, null, (err) => {
        if (err) {
          console.error(`Failed to remove member ${userName} from survey ${surveyId}:`, err);
          if (typeof onError === "function") onError(err);
          return;
        }
        const updatedMembers = (survey.members || []).filter((m) => m !== userName);
        const updatedOwners = (survey.owners || []).filter((o) => o !== userName);
        dispatch({
          type: "UPDATE_SURVEY",
          payload: { members: updatedMembers, owners: updatedOwners },
        });
        // Refresh the owners on the active/completed list rows so the "Owners:"
        // label and owner-only manage controls reflect the removal immediately.
        dispatch({ type: "SURVEY_OWNERS_UPDATED", payload: { surveyId, owners: updatedOwners } });
        if (typeof onSuccess === "function") onSuccess(userId);
      });
    },
    //DELETE the survey at /api/survey/:surveyid. On success, fire REMOVE_SURVEY so the active and completed surveys bundles can drop it from their lists in one round trip.
    doDeleteSurvey: (surveyData, { onSuccess, onError } = {}) => ({ dispatch, apiDelete, store }) => {
      const payload = surveyData || store.selectSurvey();
      const surveyId = payload && payload.id;
      if (!surveyId) {
        const err = new Error("doDeleteSurvey called without a surveyId");
        console.error(err.message);
        if (typeof onError === "function") onError(err);
        return;
      }
      apiDelete(`/api/survey/${surveyId}`, null, (err) => {
        if (err) {
          console.error(`Failed to delete survey ${surveyId}:`, err);
          if (typeof onError === "function") onError(err);
          return;
        }
        dispatch({ type: "REMOVE_SURVEY", payload: { surveyId } });
        if (typeof onSuccess === "function") onSuccess(surveyId);
      });
    },
    //PUT the survey to /api/survey/:surveyid to persist edits made on the manage screen. Mirrors the UI->server body translation in doPostNewSurvey (name->title, completed->active, etc.) so the server's Survey struct stays in sync. On success, updates the in-memory survey selector with the same payload that was sent.
    doSaveSurvey: (surveyData, { onSuccess, onError } = {}) => ({ dispatch, apiPut, store }) => {
      const payload = surveyData || store.selectSurvey();
      const surveyId = payload && payload.id;
      if (!surveyId) {
        const err = new Error("doSaveSurvey called without a surveyId");
        console.error(err.message);
        if (typeof onError === "function") onError(err);
        return;
      }
      let stratificationType = "NONE";
      if (payload.createStratifiedSurvey) {
        if (payload.residentialStratification) stratificationType = "RESIDENTIAL";
        else if (payload.floodzoneStratification) stratificationType = "FLOODZONE";
      }
      // Server's UpdateSurvey binds models.Survey and calls validateUrl(survey.ID, c) — the body's id must match the URL.
      // Coerce stratification floats — see doPostNewSurvey for context.
      const body = {
        id: surveyId,
        title: payload.name,
        description: payload.description,
        active: !payload.completed,
        due_date: payload.dueDate,
        inventory_source: payload.inventorySource,
        perimeter_geom: payload.perimeterGeometry || null,
        stratification: {
          stratification_type: stratificationType,
          margin: Number(payload.margin),
          defaultProportion: Number(payload.defaultProportion),
          proportions: payload.strataProportions || {},
          confidence: Number(payload.confidence),
          pct_control: Number(payload.percentControlStructures),
          sample_size: Number(payload.sampleSize),
        },
      };
      apiPut(`/api/survey/${surveyId}`, body, (err) => {
        if (err) {
          console.error(`Failed to save survey ${surveyId}:`, err);
          if (typeof onError === "function") onError(err);
          return;
        }
        dispatch({ type: "UPDATE_SURVEY", payload });
        if (typeof onSuccess === "function") onSuccess(payload);
      });
    },
    //POST the survey to /api/survey. On success, replace the client-generated GUID with the server-issued surveyId, sync that into the active surveys list, and invoke optional callbacks.
    doPostNewSurvey: (surveyData, { onSuccess, onError } = {}) => ({ dispatch, apiPost, store }) => {
      const payload = surveyData || store.selectSurvey();
      // Collapse the UI's two booleans + master toggle into the server's StratificationType enum.
      let stratificationType = "NONE";
      if (payload.createStratifiedSurvey) {
        if (payload.residentialStratification) stratificationType = "RESIDENTIAL";
        else if (payload.floodzoneStratification) stratificationType = "FLOODZONE";
      }
      // Translate UI shape -> server Survey struct (title/active/inventory_source/stratification).
      // Stratification floats are coerced because <select> stores them as strings on change,
      // and the server's StratificationInfo binds these as float64 — a string here is a 400.
      // proportions is the per-strata { label -> proportion } map (survey.strataProportions);
      // it persists to the survey.proportions jsonb column. survey.defaultProportion is a
      // UI-only default (the fallback for strata without an explicit override; see
      // createStratifiedReservoir) — the API/database ignore it, so it's dropped silently.
      const body = {
        title: payload.name,
        description: payload.description,
        active: !payload.completed,
        due_date: payload.dueDate,
        inventory_source: payload.inventorySource,
        perimeter_geom: payload.perimeterGeometry || null,
        stratification: {
          stratification_type: stratificationType,
          margin: Number(payload.margin),
          defaultProportion: Number(payload.defaultProportion),
          proportions: payload.strataProportions || {},
          confidence: Number(payload.confidence),
          pct_control: Number(payload.percentControlStructures),
          sample_size: Number(payload.sampleSize),
        },
      };
      apiPost(`/api/survey`, body, (err, resp) => {
        if (err) {
          console.error("Failed to create survey:", err);
          if (typeof onError === "function") onError(err);
          return;
        }
        const serverId = resp && resp.surveyId;
        // Seed the progress fields so the active-surveys list row shows the real
        // element count ("0 of N") right away instead of "0 of 0". The element
        // count is known locally (it's what we POST below) and nothing is
        // completed yet on a brand-new survey; a later /api/surveys refetch will
        // recompute these from the /progress endpoint.
        const totalCount = Array.isArray(payload.elements) ? payload.elements.length : 0;
        const progressSeed = { completedCount: 0, totalCount, percentComplete: 0 };
        // Survey now exists server-side: drop isNew so subsequent member edits persist.
        const created = serverId
          ? { ...payload, id: serverId, isNew: false, ...progressSeed }
          : { ...payload, isNew: false, ...progressSeed };
        dispatch({ type: "UPDATE_SURVEY", payload: created });
        store.doAddSurvey(created);

        // Without a server id we can't address the sub-resources.
        if (!serverId) {
          if (typeof onSuccess === "function") onSuccess(created);
          return;
        }

        // Resolve usernames -> userIds against the loaded roster.
        const roster = (store.selectMembers && store.selectMembers().list) || [];
        const userIdByName = roster.reduce((acc, u) => {
          acc[u.userName] = u.userId;
          return acc;
        }, {});

        const memberPosts = (created.members || []).map((userName) => {
          const userId = userIdByName[userName];
          if (!userId) {
            console.warn(`Skipping member ${userName}: no userId in roster.`);
            return Promise.resolve();
          }
          const isOwner = (created.owners || []).includes(userName);
          return new Promise((resolve) => {
            apiPost(`/api/survey/${serverId}/member`, { surveyId: serverId, userId, isOwner }, (mErr) => {
              if (mErr) console.error(`Failed to post member ${userName}:`, mErr);
              resolve();
            });
          });
        });

        // Translate UI element shape (fd_id/strata/control) to SurveyElement (fdId/strata/isControl/surveyOrder).
        // Each element carries surveyId so the server's validateElements + validateUrl checks pass.
        const elementsBody = (created.elements || []).map((e, i) => ({
          surveyId: serverId,
          fdId: typeof e.fd_id === "string" ? parseInt(e.fd_id, 10) : e.fd_id,
          strata: e.strata,
          isControl: !!e.control,
          surveyOrder: i,
        }));
        const elementsPost = elementsBody.length === 0
          ? Promise.resolve()
          : new Promise((resolve) => {
              apiPost(`/api/survey/${serverId}/elements`, elementsBody, (eErr) => {
                if (eErr) console.error("Failed to post elements:", eErr);
                resolve();
              });
            });

        Promise.all([...memberPosts, elementsPost]).then(() => {
          if (typeof onSuccess === "function") onSuccess(created);
        });
      });
    },
    selectSurvey: (state) => {console.log(state); return state.survey},
  };
export default surveyBundle