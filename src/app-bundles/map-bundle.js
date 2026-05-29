// Basemap source configuration. All sources are free of commercial license
// restrictions. `type` is consumed by the map component when constructing the
// OpenLayers source; `label`/`description` are consumed by the basemap
// switcher UI. Keeping this in the bundle keeps view code free of source URLs
// and lets the switcher render itself from the same source of truth.
//
// Source `type` values:
//   - 'osm'         -> ol/source/OSM
//   - 'xyz'         -> ol/source/XYZ        (uses url, attributions, maxZoom)
//   - 'arcgisrest'  -> ol/source/TileArcGISRest (uses url, attributions)
export const BASEMAP_CONFIG = {
  osm: {
    label: 'Streets',
    description: 'OpenStreetMap (ODbL)',
    type: 'osm',
  },
  usgs: {
    label: 'USGS',
    description: 'USGS National Map imagery (US, max zoom ~16)',
    type: 'xyz',
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
    attributions: 'Imagery courtesy of the U.S. Geological Survey, The National Map',
    maxZoom: 16,
  },
  naip: {
    label: 'NAIP',
    description: 'USDA NAIP imagery (CONUS only)',
    type: 'arcgisrest',
    url: 'https://gis.apfo.usda.gov/arcgis/rest/services/NAIP/USDA_CONUS_PRIME/ImageServer',
    attributions: 'Imagery courtesy of the USDA NAIP / Aerial Photography Field Office',
  },
  sentinel: {
    label: 'Sentinel-2',
    description: 'Sentinel-2 cloudless (global, ~10 m)',
    type: 'xyz',
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg',
    attributions: 'Sentinel-2 cloudless - <a href="https://s2maps.eu">s2maps.eu</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data)',
    maxZoom: 16,
  },
};
export const BASEMAPS = Object.keys(BASEMAP_CONFIG);

//the map bundle manages map state. currently the state is xy center, zoom level, the map reference, the perimeter geometry (stringified GeoJSON, EPSG:4326) that should be displayed as a layer and fit to, and the active basemap key (one of BASEMAPS).
const mapBundle = {
    name: 'map',

    getReducer: () => {
      const initialState = {
        center: [-94.58, 39.1], // Kansas City
        zoom: 15,
        map: null,
        perimeterGeometry: null,
        basemap: 'osm',
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
            case 'MAP_PERIMETER_UPDATED':
                return { ...state, perimeterGeometry: payload };
            case 'MAP_BASEMAP_UPDATED':
                return { ...state, basemap: payload };
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
    // Set the perimeter geometry to display as a layer and fit the view to. Pass a stringified GeoJSON geometry in EPSG:4326, or null to clear.
    doSetMapPerimeter: (perimeterGeometry) => ({ dispatch }) => {
      dispatch({ type: 'MAP_PERIMETER_UPDATED', payload: perimeterGeometry || null });
    },
    // Set the active basemap. Accepts one of the keys in BASEMAPS; unknown values fall back to 'osm'.
    doSetMapBasemap: (basemap) => ({ dispatch }) => {
      const next = BASEMAPS.includes(basemap) ? basemap : 'osm';
      dispatch({ type: 'MAP_BASEMAP_UPDATED', payload: next });
    },
    // Selectors
    selectMapCenter: (state) => state.map.center,
    selectMapZoom: (state) => state.map.zoom,
    selectMap: (state) => state.map.map,
    selectMapPerimeter: (state) => state.map.perimeterGeometry,
    selectMapBasemap: (state) => state.map.basemap,
  };
export default mapBundle