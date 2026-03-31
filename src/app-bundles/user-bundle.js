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