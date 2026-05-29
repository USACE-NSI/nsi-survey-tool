//the active surveys bundle manages a list of active surveys. it allows to add a survey to the state list. it is used in the completed surveys bundle to remove an active survey that is being updated as completed.
//it also owns the shared fetch from /api/surveys, splitting the response into the active and completed lists in a single round trip.
import Papa from "papaparse";

// Count how many distinct structures are completed in a survey report CSV
// (server handler GetSurveyReport). The report carries one row per surveyed
// assignment with a `completed` flag; control structures can be surveyed by
// more than one surveyor, so we dedupe on fdId to count structures, not rows.
const countCompletedStructures = (csv) => {
  const toBool = (val) => {
    if (typeof val === "boolean") return val;
    if (val === undefined || val === null) return false;
    return ["true", "1", "yes", "t", "y"].includes(String(val).toLowerCase().trim());
  };
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  const completed = new Set();
  for (const row of parsed.data || []) {
    if (toBool(row.completed) && row.fdId != null && row.fdId !== "") {
      completed.add(row.fdId);
    }
  }
  return completed.size;
};

const activeSurveysBundle = {
    name: 'activeSurveys',
    getReducer: () => {
      const initialState = {
         list: [],
         fetching: false,
         loaded: false,
        };
      return (state = initialState, { type, payload }) => {
        switch(type){
            case "UPDATE_ACTIVE_SURVEYS":
                return {...state, ...payload}
            case "SURVEYS_FETCH_START":
                return {...state, fetching: true};
            case "SURVEYS_FETCH_FINISH":
                return {...state, fetching: false, loaded: true, list: payload.active};
            case "SURVEY_MEMBERS_UPDATED": {
                const list = state.list.map((s) =>
                    s.id === payload.surveyId
                        ? { ...s, owners: payload.owners, members: payload.members }
                        : s
                );
                return { ...state, list };
            }
            case "SURVEY_PROGRESS_UPDATED": {
                const list = state.list.map((s) =>
                    s.id === payload.surveyId
                        ? {
                            ...s,
                            percentComplete: payload.percentComplete,
                            completedCount: payload.completedCount,
                            totalCount: payload.totalCount,
                        }
                        : s
                );
                return { ...state, list };
            }
            case "REMOVE_SURVEY": {
                const list = state.list.filter((s) => s.id !== payload.surveyId);
                return { ...state, list };
            }
        }
        return state;
      };
    },
    doFetchSurveys: () => ({ dispatch, apiGet, apiFetch }) => {
      dispatch({ type: "SURVEYS_FETCH_START" });
      apiGet(`/api/surveys`, (err, body) => {
        if (err) {
          console.error("Failed to fetch surveys:", err);
          dispatch({ type: "SURVEYS_FETCH_FINISH", payload: { active: [], completed: [] } });
          return;
        }
        // Map server shape (title/active/inventory_source/due_date) onto the UI shape (name/completed/inventorySource/dueDate) so existing components keep working.
        // Strip perimeter_geom so list rows don't carry geometry — the server still returns it from user-surveys/admin-surveys, and the survey bundle hydrates it via doSelectSurvey when a row is opened.
        const surveys = (Array.isArray(body) ? body : []).map((row) => {
          const { title, active, inventory_source, due_date, ...rest } = row;
          delete rest.perimeter_geom;
          return {
            ...rest,
            name: title,
            completed: !active,
            dueDate: due_date,
            inventorySource: inventory_source,
            owners: [],
            members: [],
          };
        });
        const active = surveys.filter((s) => !s.completed);
        const completed = surveys.filter((s) => s.completed);
        dispatch({ type: "SURVEYS_FETCH_FINISH", payload: { active, completed } });
        // Fan out per-survey member fetches so owners/members hydrate after the list renders.
        surveys.forEach((s) => {
          apiGet(`/api/survey/${s.id}/members`, (mErr, mBody) => {
            if (mErr) {
              console.error(`Failed to fetch members for survey ${s.id}:`, mErr);
              return;
            }
            const all = Array.isArray(mBody) ? mBody : [];
            const owners = all.filter((m) => m.isOwner).map((m) => m.userName);
            const members = all.map((m) => m.userName);
            dispatch({
              type: "SURVEY_MEMBERS_UPDATED",
              payload: { surveyId: s.id, owners, members },
            });
          });
        });
        // Fan out per-active-survey progress: completed structures (from the
        // report) over total structure elements (from /elements). The two
        // requests run concurrently and the bar updates once both resolve.
        active.forEach((s) => {
          let total = null;
          let completed = null;
          const dispatchProgress = () => {
            if (total === null || completed === null) return;
            const percentComplete = total > 0 ? Math.min(1, completed / total) : 0;
            dispatch({
              type: "SURVEY_PROGRESS_UPDATED",
              payload: {
                surveyId: s.id,
                percentComplete,
                completedCount: completed,
                totalCount: total,
              },
            });
          };
          apiGet(`/api/survey/${s.id}/elements`, (eErr, eBody) => {
            if (eErr) {
              console.error(`Failed to fetch elements for survey ${s.id}:`, eErr);
            }
            total = Array.isArray(eBody) ? eBody.length : 0;
            dispatchProgress();
          });
          apiFetch(`/api/survey/${s.id}/report`)
            .then((resp) => (resp.ok ? resp.text() : ""))
            .then((csv) => {
              completed = csv ? countCompletedStructures(csv) : 0;
              dispatchProgress();
            })
            .catch((err) => {
              console.error(`Failed to fetch report for survey ${s.id}:`, err);
              completed = 0;
              dispatchProgress();
            });
        });
      });
    },
    //this only adds to the state store. it probably makes sense that the changes consolidated here should be propigated to the database through the api.
    //@TODO add api call to add a survey to the active surveys list.
    doAddSurvey: (surveyData) => ({ dispatch, store }) => {
      const activeSurveys = store.selectActiveSurveys();
      const currentList = activeSurveys?.list || [];

      // Check if it already exists
      const exists = currentList.some(s => s.id === surveyData.id);

      let newList;
      if (exists) {
        // Replace the existing item with the new surveyData
        newList = currentList.map(s => s.id === surveyData.id ? surveyData : s);
      } else {
        // It's new, so add it to the list
        newList = [...currentList, surveyData];
      }

      dispatch({
        type: "UPDATE_ACTIVE_SURVEYS",
        payload: { list: newList }
      });
    },
    selectActiveSurveys: (state) => state.activeSurveys,
    reactSurveysFetch: (state) => {
      if (
        state.auth &&
        state.auth.token &&
        !state.activeSurveys.loaded &&
        !state.activeSurveys.fetching
      ) {
        return { actionCreator: "doFetchSurveys" };
      }
    },
  }
export default activeSurveysBundle
