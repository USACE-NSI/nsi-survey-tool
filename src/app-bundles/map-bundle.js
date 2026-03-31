const mapBundle = {
    name: 'map',
  
    getReducer: () => {
      const initialState = {
        center: [-94.58, 39.1], // Kansas City
        zoom: 15,
        map: null
      };
  
      return (state = initialState, { type, payload }) => {
        switch(type){
            case 'MAP_VIEW_UPDATED':
                console.log("state")
                console.log(state)
                console.log("payload")
                console.log(payload)
            return { ...state, ...payload };
            case 'MAP_REFERENCE_UPDATED':
                console.log("state")
                console.log(state)
                console.log("payload")
                console.log(payload)
            return { ...state, ...payload };
            default:
            return state;
        }

      };
    },
  
    // Action creator to update the store from map movements
    doUpdateMapView: (viewData) => ({ dispatch }) => {
        console.log(viewData)
      dispatch({ type: 'MAP_VIEW_UPDATED', payload: viewData });
    },
    doUpdateMapReference: (mapData) => ({dispatch}) =>{
        console.log(mapData)
        dispatch({ type: 'MAP_REFERENCE_UPDATED', payload: {map: mapData} });
    },
    // Selectors
    selectMapCenter: (state) => state.map.center,
    selectMapZoom: (state) => state.map.zoom,
    selectMap: (state) => state.map.map,
  };
export default mapBundle 