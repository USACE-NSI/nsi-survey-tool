///A survey element is a single structure and is a row in the survey table. This currently functions off of a default survey or a survey being updated by the user by clicking on the map. Ideally there will be a previous and next for advancing the survey element
//@TODO add an api call to advance the survey to the next element and a call to back up to the previous one.
//@TODO add an api call to submit a finished survey element to database. if on a previous element upsert will be required.
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
  fdId: "n/a",
  invalidStructure: false,
  noStreetView: false,
  shouldInitialize: false,
  occupancyType: "Unknown",
  damcat: "Unknown",
  xy_updating: false,
  x: 0.0,
  y: 0.0,
  x_invalid: false,
  y_invalid: false,
  found_ht: 0.0,
  foundHtInvalid: false,
  stories: 0,
  storiesInvalid: false,
  sq_ft: 0.0,
  sqFtInvalid: false,
  found_type: "Unknown",
  replacement_type: "Unknown",
  quality: "Unknown",
  const_type: "Unknown",
  garage: "Unknown",
  roof_style: "Unknown",
  survey_element_invalid: true,
  // Navigation state for tray gating. fetchingAssignment is true while a
  // NEXT/PREVIOUS request is in flight (prevents double-clicks); atFirst is
  // set when the server signals there is no earlier assignment to roll back
  // to (server returns {"result":"first"} from /survey/:id/previous).
  fetchingAssignment: false,
  atFirst: false,
  // True from the moment a survey is opened / a NEXT|PREVIOUS load begins until
  // a valid assignment has been presented (or loading settles). The survey tray
  // keeps its entry form disabled while this is true so a surveyor can't edit
  // before a real assignment is on screen.
  isLoading: false,
  // True once NEXT has loaded an assignment, which keeps the NEXT button
  // disabled so a second click can't discard the surveyor's unsaved entries.
  // Cleared by SUBMIT (which advances on its own) and by PREVIOUS.
  awaitingSubmit: false,
  // Set when the server has no assignment to hand out ({"result":"completed"}
  // from /survey/:id/assignment). The tray uses this to disable NEXT and show
  // a message instead of leaving an enabled button that re-fetches "completed"
  // on every click. Rides on defaultSurvey, so it clears automatically once a
  // real assignment loads (...defaultSurvey, ...body) or a new survey is
  // selected. NOTE: the server returns "completed" as a catch-all — it means
  // "nothing assignable to you", NOT necessarily "everything is surveyed".
  // noAssignment holds the disambiguated reason for the tray message:
  //   "all-done"      every structure in the survey is already surveyed
  //   "no-elements"   the survey has no structures at all (nothing to assign)
  //   "none-available" structures exist but none are assignable to you
  //   "" (default)    not in the no-assignment state
  allCompleted: false,
  noAssignment: "",
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
          // Full replace (not merge) so transient keys like saId/cbfips from a
          // prior assignment are cleared, not just overwritten. Used when a new
          // survey is selected so the tray doesn't carry stale element data.
          case "SURVEY_ELEMENT_RESET":
            return { ...defaultSurvey };
          default:
            
        }
        return state;
      }
    },
    //determines if a survey element is valid for committing. if a user sets "invalidStructure" no other fields are necessary. 
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
    // Takes a partial survey-element (must carry fd_id), fetches the matching
    // NSI structure via the nsi bundle, and overlays only damcat, occupancy
    // type, and x/y onto the surveyElement. All other fields (found_ht,
    // stories, sq_ft, found_type, replacement_type, etc.) are intentionally
    // left untouched so the surveyor enters them. After the overlay,
    // centers the map on the structure at zoom 18 and marks the fd_id as the
    // selected feature so the vector-tile layer's highlight style draws a
    // marker around it.
    doAutofillFromNsi: (surveyElement) => ({ dispatch, store }) => {
      const fdId = surveyElement && surveyElement.fd_id;
      if (fdId == null) return;
      // Pin the survey this autofill belongs to. The NSI fetch is async, so if
      // the surveyor switches surveys (or back to the dashboard) while it's in
      // flight, the in-flight onSuccess would otherwise overwrite the new
      // survey's element and zoom the map to the *previous* survey's structure.
      // Bail on resolution if the active survey has changed underneath us.
      const requestSurvey = store.selectSurvey();
      const requestSurveyId = requestSurvey && requestSurvey.id;
      store.doFetchNsiStructure(fdId, {
        onSuccess: (nsi) => {
          const activeSurvey = store.selectSurvey();
          const activeSurveyId = activeSurvey && activeSurvey.id;
          if (activeSurveyId !== requestSurveyId) {
            console.log(
              `doAutofillFromNsi: discarding stale NSI result for fd_id ${fdId} (survey ${requestSurveyId} → ${activeSurveyId})`,
            );
            return;
          }
          // NSI may return either bare properties or a GeoJSON Feature.
          const props = (nsi && nsi.properties) || nsi || {};
          // Occtype is "<class>-<subtype>" (e.g. RES1-1SNB); the survey only cares about the class token.
          const occtype = props.occtype
            ? String(props.occtype).split("-")[0]
            : "RES1";
          dispatch({
            type: "SURVEY_LOADED",
            payload: {
              surveyElement: {
                damcat: props.st_damcat || "Unknown",
                occupancyType: occtype,
                x: props.x,
                y: props.y,
                cbfips: props.cbfips,
              },
            },
          });
          // NSI x/y are lon/lat (EPSG:4326), which is what the map bundle stores.
          if (Number.isFinite(props.x) && Number.isFinite(props.y)) {
            store.doUpdateMapView({ center: [props.x, props.y], zoom: 18 });
          }
          // Highlight the structure on the vector-tile layer (feature.getId() === fdId triggers the cyan circle in map.jsx).
          store.doSelectFeature(fdId);
        },
        onError: (err) => {
          console.error(`Failed to autofill survey element from NSI for fd_id ${fdId}:`, err);
        },
      });
    },
    // Reset the survey element back to defaultSurvey. Dispatched when a survey
    // is (re)selected so a stale, locked-out element doesn't linger in the tray
    // and so the survey page can detect "no assignment loaded yet" via !saId.
    doSurveyResetElement: () => ({ dispatch }) => {
      dispatch({ type: "SURVEY_ELEMENT_RESET" });
    },
    doSurveyUpdateData: (surveyElement) => ({ dispatch }) => {
      dispatch({
        type: "SURVEY_LOADED",
        payload: {
          surveyElement: { ...surveyElement },
        }
      })
    },
    //Retrieve the next survey element assigned to the surveyor for the currently selected survey.
    //Hits GET /api/survey/:surveyId/assignment (server handler AssignSurveyElement) — the server picks the next assignment for the authenticated surveyor, so the client doesn't track position.
    //The assignment carries fdId/saId plus any survey metadata; we seed the surveyElement from it and then hand fdId to doAutofillFromNsi so the live NSI structure properties hydrate the row.
    //The server returns {"result":"completed"} once all assignments are done — we skip the autofill in that case.
    doSurveyFetchNext: () => ({ dispatch, store, apiGet }) => {
      const survey = store.selectSurvey();
      const surveyId = survey && survey.id;
      if (!surveyId) {
        console.warn("doSurveyFetchNext: no survey selected");
        return;
      }
      if (store.selectSurveyElement().fetchingAssignment) return;
      dispatch({
        type: "SURVEY_LOADED",
        payload: { surveyElement: { fetchingAssignment: true, isLoading: true } },
      });
      apiGet(`/api/survey/${surveyId}/assignment`, (err, body) => {
        if (err) {
          console.error(`Failed to fetch next assignment for survey ${surveyId}:`, err);
          dispatch({ type: "SURVEY_LOADED", payload: { surveyElement: { fetchingAssignment: false, isLoading: false } } });
          return;
        }
        if (!body) {
          console.warn(`doSurveyFetchNext: empty assignment response for survey ${surveyId}`);
          dispatch({ type: "SURVEY_LOADED", payload: { surveyElement: { fetchingAssignment: false, isLoading: false } } });
          return;
        }
        if (body.result === "completed") {
          // The server returns "completed" whenever it can't hand this surveyor
          // an element — which is NOT the same as "every structure is surveyed".
          // Disambiguate from the survey's own progress counts (loaded for the
          // active-surveys progress bar; see active-surveys-bundle) so the tray
          // can show an accurate message instead of falsely claiming completion.
          const sv = store.selectSurvey() || {};
          const total = sv.totalCount;
          const done = sv.completedCount;
          let noAssignment = "none-available";
          if (total === 0) {
            noAssignment = "no-elements";
          } else if (total != null && done != null && done >= total) {
            noAssignment = "all-done";
          }
          console.log(
            `doSurveyFetchNext: server returned "completed" for survey ${surveyId} (reason: ${noAssignment}, completed ${done}/${total})`
          );
          // defaultSurvey already has fetchingAssignment:false and atFirst:false.
          // allCompleted gives the tray something to disable NEXT on and show a
          // message, so the button doesn't sit enabled re-fetching "completed".
          dispatch({ type: "SURVEY_LOADED", payload: { surveyElement: { ...defaultSurvey, allCompleted: true, noAssignment } } });
          return;
        }
        // Reset transient/edit state by starting from defaultSurvey (which clears fetchingAssignment + atFirst), then overlay whatever the server returned (saId, fdId, x, y, occupancyType, damcat, ...).
        // awaitingSubmit gates the NEXT button so the loaded assignment can't be discarded by another NEXT click until it's submitted or the user goes back.
        dispatch({
          type: "SURVEY_LOADED",
          payload: { surveyElement: { ...defaultSurvey, ...body, awaitingSubmit: true } },
        });
        // Pull live structure properties from NSI for this fdId; doAutofillFromNsi handles the fetch + dispatch.
        if (body.fdId != null) {
          store.doAutofillFromNsi({ fd_id: body.fdId });
        } else {
          console.warn(`doSurveyFetchNext: assignment for survey ${surveyId} has no fdId`);
        }
      });
    },
    //Roll the current assignment back one survey_order step and load that element.
    //Hits GET /api/survey/:surveyId/previous (server handler PreviousSurveyElement) — server returns a SurveyStructure shaped exactly like doSurveyFetchNext so the same hydrate-then-autofill flow applies. When the user is already on the first element the server responds HTTP 200 with either {"result":"first"} or a stub carrying the nil saId (no earlier assignment exists); we detect that, set surveyElement.atFirst so the tray button disables itself, and leave the current element on screen.
    doSurveyFetchPrevious: () => ({ dispatch, store, apiGet }) => {
      const survey = store.selectSurvey();
      const surveyId = survey && survey.id;
      if (!surveyId) {
        console.warn("doSurveyFetchPrevious: no survey selected");
        return;
      }
      if (store.selectSurveyElement().fetchingAssignment) return;
      dispatch({
        type: "SURVEY_LOADED",
        payload: { surveyElement: { fetchingAssignment: true, isLoading: true } },
      });
      apiGet(`/api/survey/${surveyId}/previous`, (err, body) => {
        if (err) {
          console.error(`Failed to fetch previous assignment for survey ${surveyId}:`, err);
          // A real error (auth/network/5xx) is no longer the "at first element"
          // signal: the fixed server answers that case with HTTP 200 (see the
          // nil-saId check below). Leave the button enabled so a retry stays
          // possible instead of falsely disabling it on a transient failure.
          dispatch({
            type: "SURVEY_LOADED",
            payload: { surveyElement: { fetchingAssignment: false, isLoading: false } },
          });
          return;
        }
        if (!body) {
          console.warn(`doSurveyFetchPrevious: empty assignment response for survey ${surveyId}`);
          dispatch({ type: "SURVEY_LOADED", payload: { surveyElement: { fetchingAssignment: false, isLoading: false } } });
          return;
        }
        // "Already at the first element" now comes back as HTTP 200. The server's
        // PreviousAssignedSurveyElement returns uuid.Nil when there's no earlier
        // assignment, so GetStructure hands back a stub carrying the nil saId
        // ("000…000") and no real fdId. Treat either the explicit {"result":"first"}
        // contract or that nil-saId stub as "don't move": set atFirst and keep the
        // current element on screen instead of overwriting it with the empty stub.
        const NIL_UUID = "00000000-0000-0000-0000-000000000000";
        if (body.result === "first" || !body.saId || body.saId === NIL_UUID) {
          console.log(`doSurveyFetchPrevious: already at first assignment for survey ${surveyId}`);
          dispatch({
            type: "SURVEY_LOADED",
            payload: { surveyElement: { fetchingAssignment: false, atFirst: true, isLoading: false } },
          });
          return;
        }
        // defaultSurvey clears fetchingAssignment + atFirst back to false so a successful PREVIOUS re-enables the button.
        dispatch({
          type: "SURVEY_LOADED",
          payload: { surveyElement: { ...defaultSurvey, ...body } },
        });
        // Stepping backward invalidates the "X of Y" progress readout: control
        // structures are surveyed by multiple surveyors, so once we move off the
        // forward edge we can't cheaply know which ordinal this element is. Show
        // "*" for the completed count until the next submit calls
        // doRefreshSurveyProgress and replaces it with a real number again.
        dispatch({ type: "UPDATE_SURVEY", payload: { completedCount: "*" } });
        if (body.fdId != null) {
          store.doAutofillFromNsi({ fd_id: body.fdId });
        } else {
          console.warn(`doSurveyFetchPrevious: assignment for survey ${surveyId} has no fdId`);
        }
      });
    },
    //POST the current surveyElement as a SurveyStructure to /api/survey/:surveyId/assignment (server handler SaveSurveyAssignment).
    //The handler binds models.SurveyStructure — numeric fields (found_ht/stories/sq_ft/x/y/fdId) are coerced because text inputs store strings. Transient UI flags (_invalid, xy_updating, shouldInitialize, survey_element_invalid) are stripped.
    //On success advance to the next assignment so the surveyor doesn't have to click NEXT manually.
    doSurveySubmit: () => ({ store, apiPost }) => {
      const survey = store.selectSurvey();
      const surveyId = survey && survey.id;
      if (!surveyId) {
        console.warn("doSurveySubmit: no survey selected");
        return;
      }
      const s = store.selectSurveyElement();
      if (!s.saId) {
        console.warn("doSurveySubmit: no active assignment to save (missing saId)");
        return;
      }
      const body = {
        saId: s.saId,
        fdId: typeof s.fdId === "string" ? parseInt(s.fdId, 10) : s.fdId,
        x: Number(s.x),
        y: Number(s.y),
        invalidStructure: !!s.invalidStructure,
        noStreetView: !!s.noStreetView,
        cbfips: s.cbfips || "",
        occupancyType: s.occupancyType || "",
        damcat: s.damcat || "",
        found_ht: Number(s.found_ht),
        stories: Number(s.stories),
        sq_ft: Number(s.sq_ft),
        found_type: s.found_type || "",
        replacement_type: s.replacement_type || "",
        quality: s.quality || "",
        const_type: s.const_type || "",
        garage: s.garage || "",
        roof_style: s.roof_style || "",
      };
      apiPost(`/api/survey/${surveyId}/assignment`, body, (err) => {
        if (err) {
          console.error(`Failed to save assignment for survey ${surveyId}:`, err);
          return;
        }
        store.doSurveyFetchNext();
        // Re-pull progress so the tray's "X of Y" reflects this submission (and
        // any submitted by other surveyors since the list loaded). The counts
        // live on the survey object; nothing else updates them mid-survey.
        // @TODO fix this - add api call to fetch completed count outside of the
        // report generation workflow (doRefreshSurveyProgress currently parses
        // the whole report CSV just to count completed structures).
        if (store.doRefreshSurveyProgress) store.doRefreshSurveyProgress(surveyId);
      });
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
        const fdId = feature ? feature.getId() : null;
        store.doSelectFeature(fdId)
        store.doAutofillFromNsi(fdId != null ? { fdId } : null)
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
            // A drawn area is always a valid number, so clear any stale invalid
            // flag a prior empty/bad sq_ft entry may have left set. Without this
            // sqFtInvalid sticks true and keeps survey_element_invalid true,
            // blocking SUBMIT even though the value is fine.
            sqFtInvalid: false,
          };
          dispatch({
            type: "SURVEY_LOADED",
            payload: { surveyElement: updatedSurvey }
          });
          // Recompute commit-validity now that sq_ft changed via the map (this
          // path bypasses the input's onBlur numberValidation that normally
          // triggers it).
          store.doSurveyElementInvalid();
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
            // Map-picked coords are always valid numbers; clear any stale
            // invalid flags so they don't keep survey_element_invalid true.
            x_invalid: false,
            y_invalid: false,
          }}
        })
        // Recompute commit-validity — this path bypasses the input onBlur
        // numberValidation that normally triggers it.
        store.doSurveyElementInvalid();
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