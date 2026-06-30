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
        // Normalize the /api/users response into a plain array of {userId, userName}.
        // Tolerate the shapes the server has returned at 200: a bare array, a
        // double-encoded JSON string, or an array nested under a wrapper key
        // (users/data/items/results). Without this a non-array body silently
        // collapsed the roster to [] and the surveyor dropdown rendered empty.
        let data = body;
        if (typeof data === "string") {
          try { data = JSON.parse(data); } catch { data = []; }
        }
        if (data && !Array.isArray(data) && typeof data === "object") {
          data =
            data.users || data.data || data.items || data.results ||
            Object.values(data).find(Array.isArray) || [];
        }
        // Accept both camelCase (userId/userName) and snake_case (user_id/user_name).
        const list = (Array.isArray(data) ? data : [])
          .map((u) => (u && typeof u === "object")
            ? { userId: u.userId ?? u.user_id, userName: u.userName ?? u.user_name }
            : null)
          // Keep both fields — POST flows need userId to populate SurveyMember rows.
          .filter((u) => u && u.userName && u.userId);
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
