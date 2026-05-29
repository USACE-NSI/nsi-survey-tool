//the completed surveys bundle manages a list of completed surveys and provides the ability to add a survey that is marked as completed and also to remove a survey that is reopened in both cases the active survey list is also updated.
//the initial list is hydrated by the shared SURVEYS_FETCH_FINISH action dispatched from the active-surveys-bundle.
const completedSurveysBundle = {
    name: 'completedSurveys',
    getReducer: () => {
      const initialState = {
         list: [],
         fetching: false,
         loaded: false,
        };
      return (state = initialState, { type, payload }) => {
        switch(type){
            case "UPDATE_COMPLETED_SURVEYS":
                return {...state, ...payload}
            case "SURVEYS_FETCH_START":
                return {...state, fetching: true};
            case "SURVEYS_FETCH_FINISH":
                return {...state, fetching: false, loaded: true, list: payload.completed};
            case "SURVEY_MEMBERS_UPDATED": {
                const list = state.list.map((s) =>
                    s.id === payload.surveyId
                        ? { ...s, owners: payload.owners, members: payload.members }
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
    doCompleteSurvey: (surveyData) => ({ dispatch, store }) => {
      const activeSurveys = store.selectActiveSurveys();
      const completedSurveys = store.selectCompletedSurveys();

      // 1. Remove from Active (Filter is already safe for this)
      const newActiveList = (activeSurveys?.list || []).filter(
          (s) => s.id !== surveyData.id
      );

      // 2. Upsert into Completed
      const currentCompleted = completedSurveys?.list || [];
      const existsInCompleted = currentCompleted.some(s => s.id === surveyData.id);

      const newCompletedList = existsInCompleted
          ? currentCompleted.map(s => s.id === surveyData.id ? surveyData : s)
          : [...currentCompleted, surveyData];

      dispatch({ type: "UPDATE_ACTIVE_SURVEYS", payload: { list: newActiveList } });
      dispatch({ type: "UPDATE_COMPLETED_SURVEYS", payload: { list: newCompletedList } });
  },

  doRestartSurvey: (surveyData) => ({ dispatch, store }) => {
      const activeSurveys = store.selectActiveSurveys();
      const completedSurveys = store.selectCompletedSurveys();

      // 1. Remove from Completed
      const newCompletedList = (completedSurveys?.list || []).filter(
          (s) => s.id !== surveyData.id
      );

      // 2. Upsert into Active
      const currentActive = activeSurveys?.list || [];
      const existsInActive = currentActive.some(s => s.id === surveyData.id);

      const newActiveList = existsInActive
          ? currentActive.map(s => s.id === surveyData.id ? surveyData : s)
          : [...currentActive, surveyData];

      dispatch({ type: "UPDATE_ACTIVE_SURVEYS", payload: { list: newActiveList } });
      dispatch({ type: "UPDATE_COMPLETED_SURVEYS", payload: { list: newCompletedList } });
  }
    ,
    selectCompletedSurveys: (state) => state.completedSurveys,
  };
export default completedSurveysBundle
