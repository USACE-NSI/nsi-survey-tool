//the surveyBundle manages state for a given survey.  The selectSurvey is one of the most used selectors in this program. doUpdateSurvey is probably the next most used. 
//@TODO make api call to create new surveys? make api call to post a survey or edits to a survey.
//@TODO add an api call to get results
//@TODO add an api call to post surveyElements from csv.
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
         owner: null,
         members: ["billy","milly","willy"],
         completed: false,
         createStratifiedSurvey: false,
         inventorySource: "2022",
         residentialStratification: false,
         floodzoneStratification: false,
         confidence: 0.95,
         margin: 0.05,
         proportion: 0.50,
         sampleSize: 0,
         percentControlStructures: 0.01,
         elements: [],//for loading and validating... i do not think this list of elements should be in memory for long ideally we would validate and post to the database. @TODO address this.
         percentComplete:0.50,
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
        name: "",
        description: "",
         dueDate: "2028-12-12",
         owner: null,
         members: [],
         completed: false,
         createStratifiedSurvey: false,
         inventorySource: "2022",
         residentialStratification: false,
         floodzoneStratification: false,
         confidence: 0.95,
         margin: 0.05,
         proportion: 0.50,
         sampleSize: 0,
         percentControlStructures: 0.01,
         elements: [],
         percentComplete:0.50,
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
    doUpdateSurveyGUID: () => ({dispatch})=>{
        console.log("dispatching update guid")
        dispatch({
            type: "UPDATE_SURVEY",
            payload: {id:generateGuid()}
          });
    }
    ,
    selectSurvey: (state) => {console.log(state); return state.survey},
  };
export default surveyBundle