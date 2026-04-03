//This bundle manages the view state for the survey-results-analysis page and associated charting components 
//@TODO work with nick to identify all charting options and components and add them into the state. probably manage state better through an enum since there are likely many charting options.
const surveyResultsBundle = {
    name: 'surveyResults',
    getReducer: () => {
      const initialState = {
         viewTable: true,
         viewPie: false,
         viewBar: false,
         viewBox: false,
         userNameFilter: "All Surveyors",
         fieldFilter: { field: "All Fields", fieldType: "mixed", display: "All Fields" }
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