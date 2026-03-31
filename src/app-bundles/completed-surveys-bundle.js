const completedSurveysBundle = {
    name: 'completedSurveys',
    getReducer: () => {
      const initialState = {
         list: []
        };
      return (state = initialState, { type, payload }) => {
        switch(type){
            case "UPDATE_COMPLETED_SURVEYS":
                return {...state, ...payload}
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