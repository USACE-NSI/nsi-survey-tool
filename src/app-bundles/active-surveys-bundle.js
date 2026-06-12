//the active surveys bundle manages a list of active surveys. it allows to add a survey to the state list. it is used in the completed surveys bundle to remove an active survey that is being updated as completed.
//it also owns the shared fetch from /api/surveys, splitting the response into the active and completed lists in a single round trip.

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
            case "SURVEY_OWNERS_UPDATED": {
                const list = state.list.map((s) =>
                    s.id === payload.surveyId
                        ? { ...s, owners: payload.owners }
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
    doFetchSurveys: () => ({ dispatch, apiGet }) => {
      dispatch({ type: "SURVEYS_FETCH_START" });
      apiGet(`/api/surveys`, (err, body) => {
        if (err) {
          console.error("Failed to fetch surveys:", err);
          dispatch({ type: "SURVEYS_FETCH_FINISH", payload: { active: [], completed: [] } });
          return;
        }
        // Map server shape (title/active/inventory_source/due_date) onto the UI shape (name/completed/inventorySource/dueDate) so existing components keep working.
        // Strip perimeter_geom so list rows don't carry geometry — the server still returns it from user-surveys/admin-surveys, and the survey bundle hydrates it via doSelectSurvey when a row is opened.
        // Hydrate the per-strata proportion map back into survey.strataProportions (the UI shape
        // written by the Per-Strata Proportion table). The server returns it under the nested
        // stratification object (symmetric with the create/update body), but fall back to a
        // top-level proportions key in case the response is flattened. doSelectSurvey merges these
        // rows into the survey bundle, so this is where the per-strata edits re-populate on open.
        const surveys = (Array.isArray(body) ? body : []).map((row) => {
          const { title, active, inventory_source, due_date, proportions, stratification, ...rest } = row;
          delete rest.perimeter_geom;
          const strataProportions =
            (stratification && stratification.proportions) || proportions || {};
          return {
            ...rest,
            name: title,
            completed: !active,
            dueDate: due_date,
            inventorySource: inventory_source,
            strataProportions,
            owners: [],
            members: [],
          };
        });
        const active = surveys.filter((s) => !s.completed);
        const completed = surveys.filter((s) => s.completed);
        dispatch({ type: "SURVEYS_FETCH_FINISH", payload: { active, completed } });
        // Fan out per-survey owner fetches so the "Owners" label and the
        // owner-only manage controls hydrate after the list renders. Uses the
        // public /owners endpoint (GetSurveyOwners), which any logged-in user can
        // call — unlike /members, which requires owner/admin and would 401 for a
        // regular surveyor, leaving them unable to see who owns a survey.
        surveys.forEach((s) => {
          apiGet(`/api/survey/${s.id}/owners`, (oErr, oBody) => {
            if (oErr) {
              console.error(`Failed to fetch owners for survey ${s.id}:`, oErr);
              return;
            }
            const owners = (Array.isArray(oBody) ? oBody : []).map((o) => o.userName);
            dispatch({
              type: "SURVEY_OWNERS_UPDATED",
              payload: { surveyId: s.id, owners },
            });
          });
        });
        // Fan out per-active-survey progress via the dedicated progress endpoint
        // (server handler GetSurveyProgress), which returns the survey-wide
        // deduped completed element count over the survey's total element count
        // in a single round trip.
        active.forEach((s) => {
          apiGet(`/api/survey/${s.id}/progress`, (pErr, pBody) => {
            if (pErr) {
              console.error(`Failed to fetch progress for survey ${s.id}:`, pErr);
              return;
            }
            const total = pBody && typeof pBody.total === "number" ? pBody.total : 0;
            const completed = pBody && typeof pBody.completed === "number" ? pBody.completed : 0;
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
