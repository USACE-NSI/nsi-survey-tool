//the members bundle is primarily used to define what surveyors are included on a survey. they can be added or removed, a list of members is managed in the surveyBundle for the specific members on a survey. This is the grand list of all registered users on the site.
const membersBundle = {
    name: 'members',
    getReducer: () => {
      const initialState = {
         list: [],
         fetching: false,
         loaded: false,
        };
      return (state = initialState, { type, payload }) => {
        switch(type){
            case "MEMBERS_FETCH_START":
                return {...state, fetching: true};
            case "MEMBERS_FETCH_FINISH":
                return {...state, fetching: false, loaded: true, ...payload};
        }
        return state;
      };
    },
    doFetchMembers: () => ({ dispatch, apiGet }) => {
      dispatch({ type: "MEMBERS_FETCH_START" });
      apiGet(`/api/users`, (err, body) => {
        if (err) {
          console.error("Failed to fetch members:", err);
          dispatch({ type: "MEMBERS_FETCH_FINISH", payload: { list: [] } });
          return;
        }
        // Keep both userId and userName — POST flows need userId to populate SurveyMember rows.
        const list = Array.isArray(body)
          ? body.filter((u) => u && u.userName && u.userId)
          : [];
        dispatch({ type: "MEMBERS_FETCH_FINISH", payload: { list } });
      });
    },
    selectMembers: (state) => state.members,
    reactMembersFetch: (state) => {
      if (
        state.auth &&
        state.auth.token &&
        !state.members.loaded &&
        !state.members.fetching
      ) {
        return { actionCreator: "doFetchMembers" };
      }
    },
  };
export default membersBundle
