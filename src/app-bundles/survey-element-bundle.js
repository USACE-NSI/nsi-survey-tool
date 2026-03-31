
import VectorLayer from 'ol/layer/Vector';
import { transform } from 'ol/proj'
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import { getArea } from 'ol/sphere';

let locationFunction = null;
let nextFunction = null;
let clearMapfunction = function (map, evt, fun) {
  map.un(evt, fun)
  map.getTarget().style.cursor = 'default';
}
const defaultSurvey = {
  fdId: -1,
  invalidStructure: false,
  noStreetView: false,
  shouldInitialize: false,
  occupancyType: "RES1",
  damcat: "UNK",
  xy_updating: false,
  x: 1.0,
  y: 5.0,
  x_invalid: false,
  y_invalid: false,
  found_ht: 3.0,
  foundHtInvalid: false,
  stories: 10,
  storiesInvalid: false,
  sq_ft: 30.0,
  sqFtInvalid: false,
  found_type: "Base",
  replacement_type: "Aircraft Hangar",
  quality: "Below Average",
  const_type: "Stucco",
  garage: "Three Car Built In",
  roof_style: "Gambrel Style",
  survey_element_invalid: true,
}
const surveyElementBundle = {
    name: 'surveyElement',

    getReducer: () =>{
      const initialState = {...defaultSurvey}
      return (state = initialState, {type, payload}) => {
        switch (type) {
          case "SURVEY_LOADED":
          case 'SURVEY_LOCATION_UPDATE':
            console.log("state")
            console.log(state)
            console.log("payload")
            console.log(payload)
            return { ...state, ...payload.surveyElement }; 
          default:
            
        }
        return state;
      }
    },
    doSurveyElementInvalid: () => ({ store, dispatch }) => {
      const currentSurvey = store.selectSurveyElement()

      let updatedSurvey = {
        survey_element_invalid: false
      };
      if (!currentSurvey.invalidStructure){
        if (currentSurvey.x_invalid){
          updatedSurvey.survey_element_invalid=true;
        } else if (currentSurvey.y_invalid){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.foundHtInvalid){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.storiesInvalid){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.sqFtInvalid){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.damcat===""){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.occupancyType===""){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.found_ht===""){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.stories===""){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.found_type===""){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.sq_ft===""){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.replacement_type===""){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.quality===""){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.const_type===""){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.garage===""){
          updatedSurvey.survey_element_invalid=true;
        }else if (currentSurvey.roof_style===""){
          updatedSurvey.survey_element_invalid=true;
        }
      }
      dispatch({
        type: "SURVEY_LOADED",
        payload: { surveyElement: updatedSurvey }
      });
    },
    doAutofillFromNsi: (props) => ({ dispatch }) => {
      console.log(props)
      if(!props) return;
      console.log(props)
      const updatedSurvey = {
        fdId: props.bid,
        damcat: props.st_damcat || "UNK",
        occupancyType: props.occtype || "RES1",
        x: props.x,
        y: props.y,
        invalidStructure: false,
        noStreetView: false,
        found_ht: "",
        stories: "",
        sq_ft: "",
        found_type: "",
        replacement_type: "",
        quality: "",
        const_type: "",
        garage: "",
        roof_style: "",
        survey_element_invalid: true
      };
  
      dispatch({
        type: "SURVEY_LOADED",
        payload: { surveyElement: updatedSurvey }
      });
    },
    doSurveyUpdateData: (surveyElement) => ({ dispatch }) => {
      dispatch({
        type: "SURVEY_LOADED",
        payload: {
          surveyElement: { ...surveyElement },
        }
      })
    },
    doSurveyNext:()=>({store})=>{
      //this is some place holder logic to allow users to select the next survey by clicking on the map instead of getting it from the api.
      console.log("updating singleclick from do survey next")
      const map = store.selectMap()
      if (nextFunction) {
        clearMapfunction(map, 'singleclick', nextFunction); //locationFunction should be cleaned up automatically, but rarely it is not...
        nextFunction = null;
      }
      map.getTarget().style.cursor = 'pointer';
      nextFunction = function (evt) {
        if (evt.dragging) return;
        const pixel = map.getEventPixel(evt.originalEvent);
        const feature = map.forEachFeatureAtPixel(pixel, (feat) => feat);
        console.log(feature?feature:null)
        console.log(feature?feature.getId():null);
        store.doSelectFeature(feature?feature.getId():null)
        store.doAutofillFromNsi(feature?feature.getProperties():null)
        clearMapfunction(map, 'singleclick', nextFunction);
        nextFunction = null;
      }
      map.on('singleclick', nextFunction)
    },
    doSurveyDrawSqft:()=>({dispatch, store})=>{
      //this is some place holder logic to allow users to select the next survey by clicking on the map instead of getting it from the api.
      console.log("updating draw layer from do survey drawSqft")
      const map = store.selectMap()
        if (!map) return;
        const source = new VectorSource()
        const vector = new VectorLayer({source: source})
        map.addLayer(vector)
        const draw = new Draw({ source, type: 'Polygon' });

        draw.on('drawend', (event) => {
          const geometry = event.feature.getGeometry();
          const areaMeters = getArea(geometry);
          const areaSqFtValue = (areaMeters * 10.7639).toFixed(2); // Convert m² to sqft
          const updatedSurvey = {
            sq_ft: areaSqFtValue,
          };
          dispatch({
            type: "SURVEY_LOADED",
            payload: { surveyElement: updatedSurvey }
          });
          map.removeInteraction(draw);
          map.removeLayer(vector);//should we load the geometry into the survey data so that it can be stored?
        });
  
        map.addInteraction(draw);

    },
    doSurveyModifyXY: () => ({ dispatch, store }) => {
      console.log("updating singleclick from do survey modify xy")
      const map = store.selectMap()
      if (locationFunction) {
        clearMapfunction(map, 'singleclick', locationFunction); //locationFunction should be cleaned up automatically, but rarely it is not...
        locationFunction = null;
      }
      map.getTarget().style.cursor = 'cell';
      locationFunction = function (evt) {
        let coord = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
        console.log(coord)
        dispatch({
          type: 'SURVEY_LOCATION_UPDATE',
          payload: {surveyElement:{
            x: coord[0],
            y: coord[1],
          }}
        })
        clearMapfunction(map, 'singleclick', locationFunction);
        locationFunction = null;
        //store.doSurveyDisplayMarker();
      }
      map.on('singleclick', locationFunction)
    },
    doSurveyStreetView: () => ({ store }) => {
      let surveyElement = store.selectSurveyElement()
      console.log(surveyElement)
      var url = "http://maps.google.com/maps?q=" + surveyElement.y + "," + surveyElement.x
      window.open(url, "_blank");
    },
    doSurveySetZoom: () => ({ store }) => {
      let surveyElement = store.selectSurveyElement()
      store.doUpdateMapView({center:[surveyElement.x,surveyElement.y]})
    },
    selectSurveyElement: state => {console.log(state); return state.surveyElement},
};
export default surveyElementBundle;