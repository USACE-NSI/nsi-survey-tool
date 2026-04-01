//the active surveys bundle manages a list of active surveys. it allows to add a survey to the state list. it is used in the completed surveys bundle to remove an active survey that is being updated as completed.
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
  }
export default activeSurveysBundle