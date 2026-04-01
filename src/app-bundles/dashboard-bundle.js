//the dashboard bundle manages the state of the dashboard view, it allows uers to switch between the panel view of creating a new survey, managing a survey viewing a table of active surveys or viewing completed surveys.
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