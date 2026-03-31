const activeSurveysBundle = {
    name: 'activeSurveys',
    getReducer: () => {
      const initialState = {
         list: []
        };
      return (state = initialState, { type, payload }) => {
        switch(type){
            case "UPDATE_ACTIVE_SURVEYS":
                return {...state, ...payload}
        }
        return state;
      };
    },
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
  }
export default activeSurveysBundle