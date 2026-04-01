//the members bundle is primarily used to define what surveyors are included on a survey. they can be added or removed, a list of members is managed in the surveyBundle for the specific members on a survey. This is the grand list of all registered users on the site.
//@TODO add ability to fetch registered users from the api to load the initial state. add the ability to register a new user on their first login.
const membersBundle = {
    name: 'members',
    getReducer: () => {
      const initialState = {
         list: ["NGO.ANGELA.T", "WALTER.GERARD.J", "COLBY-GEORGE.NOAH", "MCMASTER.JORDAN.M", "Randal Goss", "LUTZ.NICHOLAS.JOHN","MCGLINCH.NATALIE.THERESE"]//fetched from api
        };
      return (state = initialState, { type, payload }) => {
        switch(type){
            case "UPDATE_MEMBERS":
                return {...state, ...payload}
        }
        return state;
      };
    }/*,
    doAddMembers: (state) => ({dispatch, store})=>{
      console.log("dispatching " + state)
        var activeSurveys = store.selectActiveSurveys()
        console.log(activeSurveys)
        var currentSurveys = null
        if(activeSurveys){
            currentSurveys = activeSurveys.list
            currentSurveys.push(state)
        }else{
            currentSurveys = [state]
        }
        
        
        dispatch({
            type: "UPDATE_MEMBERS",
            payload: {list:currentSurveys}
          });
    }*/,
    selectMembers: (state) => state.members,
  };
export default membersBundle