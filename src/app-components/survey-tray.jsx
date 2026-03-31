import { Button } from "@usace/groundwork";
import React from "react";
import { useConnect } from "redux-bundler-hook";
import EditIcon from "@mui/icons-material/Edit";

const fwLinkHost = " https://www.hec.usace.army.mil/fwlink/?linkid=";
const occs = {
  Unknown: [
    "RES1",
    "RES2",
    "RES3",
    "RES3-AB",
    "RES3-CD",
    "RES3-EF",
    "RES4",
    "RES5",
    "RES6",
    "IND1",
    "IND2",
    "IND3",
    "IND4",
    "IND5",
    "IND6",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "COM10",
    "AGR1",
    "GOV1",
    "GOV2",
    "REL1",
    "EDU1",
    "EDU2",
    "UNKN",
  ],
};
const damcats = [
  { val: "RES", display: "Residential" },
  { val: "IND", display: "Industrial" },
  { val: "COM", display: "Commercial" },
  { val: "PUB", display: "Public" },
  { val: "UNK", display: "Unknown" },
];

const foundTypes = [
  { val: "Empty", display: "" },
  { val: "Base", display: "Basement" },
  { val: "Soli", display: "Solid Wall" },
  { val: "Craw", display: "Crawlspace" },
  { val: "Slab", display: "Slab" },
  { val: "Pile", display: "Pile" },
  { val: "Pier", display: "Pier" },
  { val: "Epir", display: "Enclosed Pier" },
  { val: "Mat", display: "Mat" },
  { val: "Cont", display: "Continuous Footing" },
  { val: "SLWB", display: "Split Level Basement" },
  { val: "SLNB", display: "Split Level No Basement" },
  { val: "SLUN", display: "Split Level Unk Basement" },
  { val: "Unkn", display: "Unknown" },
];

const rsMeansTypes = {
  Unknown: [
    "",
    "SFR-Economy",
    "SFR-Average",
    "SFR-Custom",
    "SFR-Luxury",
    "Apartment",
    "Manufactured",
    "Aircraft Hangar",
    "Auditorium",
    "Bank",
    "Bowling Alley",
    "Bus Terminal",
    "Car Wash",
    "Church",
    "Community Center",
    "Country Club",
    "Day Care Center",
    "Factory",
    "Fire Station",
    "Funeral Home",
    "Garage - Auto Sales",
    "Garage - Repair",
    "Garage - Service Station",
    "Gymnasium",
    "Hospital",
    "Hotel",
    "Medical Office",
    "Motel",
    "Nursing Home",
    "Office",
    "Parking Garage",
    "Post Office",
    "Police Station",
    "Post Frame Barn",
    "Restaurant - Dining",
    "Restaurant - Fast Food",
    "Rink - Hockey or Soccer",
    "School - Elementary",
    "School - High",
    "School - Vocational",
    "Store - Convenience",
    "Store - Retail",
    "Store - Supermarket",
    "Veterinary Hospital",
    "Warehouse",
    "Other",
    "Unknown",
  ],
};
const qualities = ["", "Below Average", "Average", "Like New", "Unknown"];
const constTypes = [
  "",
  "Wood",
  "Brick",
  "Stucco",
  "Manufactured",
  "Masonry or Concrete",
  "Steel",
  "Other",
  "Unknown",
];
const garageTypes = [
  "",
  "None",
  "One Car Attached",
  "Two Car Attached",
  "Three Car Attached",
  "One Car Detached",
  "Two Car Detached",
  "Three Car Detached",
  "One Car Built In",
  "Two Car Built In",
  "Three Car Built In",
  "Unknown",
];
const roofStyles = [
  "",
  "Simple Gable",
  "Gable and Valley",
  "Simple Hip",
  "Hip and Valley",
  "Mono-Pitched",
  "Offset Mono-Pitched",
  "Flat",
  "Gambrel Style",
  "Other",
  "Unknown",
];

function SurveyTray() {
  const {
    surveyElement,
    doSurveyStreetView,
    doSurveySetZoom,
    doSurveyModifyXY,
    doSurveyNext,
    doSurveyUpdateData,
    doSurveyElementInvalid,
    doSurveyDrawSqft,
  } = useConnect(
    "selectSurveyElement",
    "doSurveyStreetView",
    "doSurveySetZoom",
    "doSurveyModifyXY",
    "doSurveyNext",
    "doSurveyUpdateData",
    "doSurveyElementInvalid",
    "doSurveyDrawSqft"
  );
  const handleChange = (field) => (e) => {
    let val = e.target.value;
    console.log(field + " " + val);
    const s = { ...surveyElement, [field]: val };
    doSurveyUpdateData(s);
    doSurveyElementInvalid();
  };
  const handleCheckedChange = (field) => (e) => {
    let val = e.target.checked;
    console.log(field + " " + val);
    const s = { ...surveyElement, [field]: val };
    doSurveyUpdateData(s);
    doSurveyElementInvalid();
  };
  const numberValidation = (field, invalidfield, valtype) => (e) => {
    let val = e.target.value;
    let valid = false;
    switch (valtype) {
      case "int":
        valid = isNaN(Number.parseInt(val, 10));
        break;
      case "dbl":
        valid = isNaN(Number.parseFloat(val));
        break;
    }
    console.log(valid);

    const s = { ...surveyElement, [invalidfield]: valid };
    if (valid) {
      const s2 = { ...s, [field]: val };
      doSurveyUpdateData(s2);
    } else {
      doSurveyUpdateData(s);
    }
    doSurveyElementInvalid();
  };
  return (
    <div>
      <Button
        title="Get Previous Survey Element"
        className="btn btn-secondary basic-toolbar-btn st-btn-tb1"
        onClick={doSurveyNext}
        style={{ padding: "2px" }}
      >
        <i>PREVIOUS</i>
      </Button>
      <Button
        title="Get Next Survey Element"
        className="btn btn-secondary basic-toolbar-btn st-btn-tb1"
        onClick={doSurveyNext}
        style={{ padding: "2px" }}
      >
        <i>NEXT</i>
      </Button>
      <Button
        title="Submit Survey Element"
        disabled={surveyElement.survey_element_invalid}
        className="btn btn-secondary basic-toolbar-btn st-btn-tb1"
        onClick={doSurveyNext}
        style={{ padding: "2px" }}
      >
        <i>SUBMIT</i>
      </Button>
      <div
        style={{
          width: "100%",
          textAlign: "center",
          fontSize: "14px",
          fontWeight: "bold",
          marginTop: "5px",
        }}
      >
        Structure ID: {surveyElement.fdId}
      </div>
      <div
        className="form-check"
        style={{ marginLeft: "20px", marginBottom: "5px" }}
      >
        <input
          type="checkbox"
          className="form-check-input"
          id="validStructure"
          onChange={handleCheckedChange("invalidStructure")}
          checked={surveyElement.invalidStructure}
        />
        <label
          className="form-check-label"
          style={{ marginLeft: "5px", marginTop: "2px" }}
          htmlFor="validStructure"
        >
          This is NOT a valid structure
        </label>
      </div>

      <div
        className="form-check"
        style={{ marginLeft: "20px", marginBottom: "5px" }}
      >
        <input
          type="checkbox"
          className="form-check-input"
          id="noStreetView"
          onChange={handleCheckedChange("noStreetView")}
          checked={surveyElement.noStreetView}
        />
        <label
          className="form-check-label"
          style={{ marginLeft: "5px", marginTop: "2px" }}
          htmlFor="noStreetView"
        >
          There is no Street View
        </label>
      </div>

      <div className="card border-secondary mb-3 st-card">
        <div className="card-header st-card-header">Location Information</div>

        <div className="st-card-body">
          <div style={{ fontsize: "12px", lineheight: "31px" }}>
            <div style={{ display: "flex" }}>
              <div style={{ paddingright: "5px" }}>X:</div>
              <input
                type="text"
                value={surveyElement.x}
                className="form-control st-input"
                id="xcoord"
                placeholder=""
                onChange={handleChange("x")}
                onBlur={numberValidation("x", "x_invalid", "dbl")}
              />
            </div>
            <div style={{ display: "flex" }}>
              <div style={{ paddingright: "5px" }}>Y:</div>
              <input
                type="text"
                value={surveyElement.y}
                className="form-control st-input"
                id="ycoord"
                placeholder=""
                onChange={handleChange("y")}
                onBlur={numberValidation("y", "y_invalid", "dbl")}
              />
            </div>
          </div>
        </div>
        <div className="gw-flex w-full mt-2" role="group">
          <Button
            className="gw-flex-1 bg-secondary border-r border-white/20 px-4 py-2 first:rounded-l-md last:rounded-r-md st-btn-tb"
            onClick={doSurveyModifyXY}
          >
            <i className="mdi mdi-map-marker-plus" />
          </Button>
          <Button
            className="gw-flex-1 bg-secondary border-r border-white/20 px-4 py-2 st-btn-tb"
            onClick={doSurveySetZoom}
          >
            <i className="mdi mdi-magnify-plus" />
          </Button>
          <Button
            className="gw-flex-1 bg-secondary px-4 py-2 last:rounded-r-md st-btn-tb"
            onClick={doSurveyStreetView}
          >
            <i className="mdi mdi-google-street-view" />
          </Button>
        </div>
      </div>
      <div className="card border-secondary mb-3 st-card">
        <div className="card-header st-card-header">Categories</div>
        <div className="card-body st-card-body">
          <div className="form-group">
            <div style={{ display: "flex" }}>
              <label style={{ flexGrow: 1 }}>Damage Category</label>
              <a
                target="_blank"
                title="Help for Damage Category"
                href={`${fwLinkHost}nsi-survey-tool-damage-categories`}
              >
                <i className="mdi mdi-help-circle-outline" />
              </a>
            </div>
            <select
              className="form-control st-input"
              id="damcat"
              onChange={handleChange("damcat")}
            >
              {damcats.map((cat) =>
                cat.val === surveyElement.damcat ? (
                  <option value={cat.val} selected>
                    {cat.display}
                  </option>
                ) : (
                  <option value={cat.val}>{cat.display}</option>
                )
              )}
            </select>
          </div>
          <div className="form-group">
            <div style={{ display: "flex" }}>
              <label style={{ flexGrow: 1 }}>Occupancy Type</label>
              <a
                target="_blank"
                title="Help for Occupancy Type"
                href={`${fwLinkHost}nsi-survey-tool-occupancy-types`}
              >
                <i className="mdi mdi-help-circle-outline" />
              </a>
            </div>
            <select
              className="form-control st-input"
              id="occclass"
              onChange={handleChange("occupancyType")}
            >
              {occs.Unknown.map((cat) =>
                cat === surveyElement.occupancyType ? (
                  <option selected>{cat}</option>
                ) : (
                  <option>{cat}</option>
                )
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="card border-secondary mb-3 st-card">
        <div className="card-header st-card-header">Foundation</div>
        <div className="card-body st-card-body">
          <div className="form-group">
            <div style={{ display: "flex" }}>
              <label style={{ flexGrow: 1 }}>Foundation Type</label>
              <a
                target="_blank"
                title="Help for Foundation Type"
                href={`${fwLinkHost}nsi-survey-tool-foundation-type`}
              >
                <i className="mdi mdi-help-circle-outline" />
              </a>
            </div>
            <select
              className="form-control st-input"
              id="foundtypes"
              onChange={handleChange("found_type")}
            >
              {foundTypes.map((cat) =>
                cat.val === surveyElement.found_type ? (
                  <option value={cat.val} selected>
                    {cat.display}
                  </option>
                ) : (
                  <option value={cat.val}>{cat.display}</option>
                )
              )}
            </select>
          </div>
          <div className="form-group">
            <div style={{ display: "flex" }}>
              <label style={{ flexGrow: 1 }}>Foundation Height(ft)</label>
              <a
                target="_blank"
                title="Help for Foundation Height"
                href={`${fwLinkHost}nsi-survey-tool-foundation-height`}
              >
                <i className="mdi mdi-help-circle-outline" />
              </a>
            </div>
            <input
              type="text"
              value={surveyElement.found_ht}
              className="form-control st-input"
              id="foundheight"
              placeholder=""
              onChange={handleChange("found_ht")}
              onBlur={numberValidation("found_ht", "foundHtInvalid", "dbl")}
            />
          </div>
        </div>
      </div>

      <div className="card border-secondary mb-3 st-card">
        <div className="card-header st-card-header">Attributes</div>
        <div className="card-body st-card-body">
          <div style={{ display: "flex" }}>
            <label style={{ flexGrow: 1 }}>Replacement Type</label>
            <a
              target="_blank"
              title="Help for Replacement Type"
              href={`${fwLinkHost}nsi-survey-tool-replacement-type`}
            >
              <i className="mdi mdi-help-circle-outline" />
            </a>
          </div>
          <select
            className="form-control st-input"
            id="occclass"
            onChange={handleChange("replacement_type")}
          >
            {rsMeansTypes.Unknown.map((cat) =>
              cat === surveyElement.replacement_type ? (
                <option selected>{cat}</option>
              ) : (
                <option>{cat}</option>
              )
            )}
          </select>

          <div style={{ display: "flex" }}>
            <label style={{ flexGrow: 1 }}>Quality</label>
            <a
              target="_blank"
              title="Help for Quality"
              href={`${fwLinkHost}nsi-survey-tool-replacement-quality`}
            >
              <i className="mdi mdi-help-circle-outline" />
            </a>
          </div>
          <select
            className="form-control st-input"
            id="occclass"
            onChange={handleChange("quality")}
          >
            {qualities.map((cat) =>
              cat === surveyElement.quality ? (
                <option selected>{cat}</option>
              ) : (
                <option>{cat}</option>
              )
            )}
          </select>

          <div style={{ display: "flex" }}>
            <label style={{ flexGrow: 1 }}>Exterior Construction Type</label>
            <a
              target="_blank"
              title="Help for Exterior Construction Types"
              href={`${fwLinkHost}nsi-survey-tool-exterior-construction`}
            >
              <i className="mdi mdi-help-circle-outline" />
            </a>
          </div>
          <select
            className="form-control st-input"
            id="occclass"
            onChange={handleChange("const_type")}
          >
            {constTypes.map((cat) =>
              cat === surveyElement.const_type ? (
                <option selected>{cat}</option>
              ) : (
                <option>{cat}</option>
              )
            )}
          </select>

          <div style={{ display: "flex" }}>
            <label style={{ flexGrow: 1 }}>Garage Type</label>
            <a
              target="_blank"
              title="Help for Garage Types"
              href={`${fwLinkHost}nsi-survey-tool-garage`}
            >
              <i className="mdi mdi-help-circle-outline" />
            </a>
          </div>
          <select
            className="form-control st-input"
            id="occclass"
            onChange={handleChange("garage")}
          >
            {garageTypes.map((cat) =>
              cat === surveyElement.garage ? (
                <option selected>{cat}</option>
              ) : (
                <option>{cat}</option>
              )
            )}
          </select>

          <div style={{ display: "flex" }}>
            <label style={{ flexGrow: 1 }}>Roof Style</label>
            <a
              target="_blank"
              title="Help for Roof Styles"
              href={`${fwLinkHost}nsi-survey-tool-roof-style`}
            >
              <i className="mdi mdi-help-circle-outline" />
            </a>
          </div>
          <select
            className="form-control st-input"
            id="occclass"
            onChange={handleChange("roof_style")}
          >
            {roofStyles.map((cat) =>
              cat === surveyElement.roof_style ? (
                <option selected>{cat}</option>
              ) : (
                <option>{cat}</option>
              )
            )}
          </select>

          <div style={{ display: "flex" }}>
            <label style={{ flexGrow: 1 }}>Number of Stories</label>
            <a
              target="_blank"
              title="Help for Number of Stories"
              href={`${fwLinkHost}nsi-survey-tool-stories`}
            >
              <i className="mdi mdi-help-circle-outline" />
            </a>
          </div>
          <input
            type="text"
            value={surveyElement.stories}
            className="form-control st-input"
            placeholder=""
            onChange={handleChange("stories")}
            onBlur={numberValidation("stories", "storiesInvalid", "dbl")}
          />

          <div style={{ display: "flex" }}>
            <label style={{ flexGrow: 1 }}>Occupied Footprint SQ Feet</label>
            <a
              target="_blank"
              title="Help for Occupied SQ Feet"
              href={`${fwLinkHost}nsi-survey-tool-square-footage`}
            >
              <i className="mdi mdi-help-circle-outline" />
            </a>
          </div>
          <div
            className="draw-input-wrapper"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={surveyElement.sq_ft}
              className="form-control st-input"
              placeholder=""
              onChange={handleChange("sq_ft")}
              onBlur={numberValidation("sq_ft", "sqFtInvalid", "dbl")}
            />
            <div className="input-group-append">
              <button
                className="draw-overlay-btn"
                type="button"
                title="Draw area on map"
                style={{
                  position: "absolute",
                  right: "-5px", // Matches the slight offset in your image
                  bottom: "5px", // Overlaps the bottom border line
                  width: "40px",
                  height: "80%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  border: "none",
                  boxShadow: "none",
                  cursor: "pointer",
                  zIndex: 10,
                }}
                onClick={doSurveyDrawSqft}
              >
                <EditIcon style={{ fontSize: "14px" }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SurveyTray;
