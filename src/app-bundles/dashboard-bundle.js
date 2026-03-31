const dashboardBundle = {
    name: 'dashboard',
    getReducer: () => {
      const initialState = {
         viewCreateNew: false,
         viewManage: false,
         viewActive: true,
         viewCompleted: false,
        };
      return (state = initialState, { type, payload }) => {
        switch(type){
            case "UPDATE_DASHBOARD_VIEW":
                return {...state, ...payload}
        }
        return state;
      };
    },
    doUpdateDashboardView: (state) => ({dispatch})=>{
        console.log("dispatching " + state)
        dispatch({
            type: "UPDATE_DASHBOARD_VIEW",
            payload: state
          });
    }
    ,
    selectDashboard: (state) => state.dashboard,
  };
export default dashboardBundle