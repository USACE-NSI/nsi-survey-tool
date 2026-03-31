const surveyResultsBundle = {
    name: 'surveyResults',
    getReducer: () => {
      const initialState = {
         viewTable: true,
         viewPie: false,
         viewBar: false,
         userNameFilter: "All Surveyors",
        };
      return (state = initialState, { type, payload }) => {
        switch(type){
            case "UPDATE_SURVEY_RESULTS_VIEW":
                return {...state, ...payload}
        }
        return state;
      };
    },
    doUpdateSurveyResults: (state) => ({dispatch})=>{
        console.log("dispatching " + state)
        dispatch({
            type: "UPDATE_SURVEY_RESULTS_VIEW",
            payload: state
          });
    }
    ,
    selectSurveyResults: (state) => state.surveyResults,
  };
export default surveyResultsBundle