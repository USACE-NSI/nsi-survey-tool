// the selection bundle is used to define a selected structure in the map. Currently it works off of the fd_id of the structure.
const selectionBundle = {
    name: 'selection',
    getReducer: () => {
      const initialState = { selectedId: null };
      return (state = initialState, { type, payload }) => {
        if (type === 'FEATURE_SELECTED') return { ...state, selectedId: payload };
        return state;
      };
    },
    doSelectFeature: (id) => ({ dispatch }) => {
        console.log("selected : " + id)
      dispatch({ type: 'FEATURE_SELECTED', payload: id });
    },
    selectSelectedId: (state) => state.selection.selectedId,
  };
export default selectionBundle