//this bundle supports user identity (logged in user). not all users will be granted permission to create new surveys, so we need to add ability to set that boolean
//@TODO add ability to get identity from keycloak, and to get roles based access from the database via the api.
const userBundle = {
    name: 'user',
    getReducer: () => {
      const initialState = {
        id: null,
         name: null,
         canCreateNewSurvey: false
        };
      return (state = initialState, { type, payload }) => {
        switch(type){
            case "UPDATE_USER":
                return {...state, ...payload}
        }
        return state;
      };
    },
    doUpdateUser: (state) => ({dispatch})=>{
        console.log("dispatching " + state)
        dispatch({
            type: "UPDATE_USER",
            payload: state
          });
    }
    ,
    selectUser: (state) => state.user,
  };
export default userBundle