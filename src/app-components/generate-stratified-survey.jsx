import { Button } from "@usace/groundwork";
import { useConnect } from "redux-bundler-hook";
import { Field, Input, Label } from "@usace/groundwork";
export default function GenerateStratifiedSurvey() {
  const fwLinkHost = " https://www.hec.usace.army.mil/fwlink/?linkid=";
  const { survey, doUpdateSurvey } = useConnect(
    "selectSurvey",
    "doUpdateSurvey"
  );
  const inventories = [
    //this list will ultimately come from the nsi api
    { val: "2022", display: "NSI 2022" },
    { val: "2026", display: "NSI 2026" },
    { val: "USER", display: "USER PROVIDED 1" },
  ];
  const confidence = [
    { val: 0.95, display: "95%" },
    { val: 0.9, display: "90%" },
    { val: 0.8, display: "80%" },
  ];
  const margin = [
    { val: 0.05, display: "5%" },
    { val: 0.02, display: "2%" },
    { val: 0.01, display: "1%" },
  ];
  const proportion = [
    { val: 0.5, display: "50%" },
    { val: 0.25, display: "25%" },
    { val: 0.75, display: "75%" },
  ];

  const handleChange = (field) => (e) => {
    let val = e.target.value;
    console.log(field + " " + val);
    const s = { ...survey, [field]: val };
    doUpdateSurvey(s);
  };
  const handleStrataChecked = (field) => (e) => {
    let val = e.target.value;
    console.log(field + " " + val);
    const s = { ...survey, [field]: val };
    doUpdateSurvey(s);
  };
  return (
    <div>
      <div className="form-group">
        <div style={{ display: "flex" }}>
          <label style={{ flexGrow: 1 }}>NSI Inventory</label>
          <a
            target="_blank"
            title="Help for Inventory Source"
            href={`${fwLinkHost}nsi-survey-tool-damage-categories`}
          >
            <i className="mdi mdi-help-circle-outline" />
          </a>
        </div>
        <select
          className="form-control st-input"
          id="damcat"
          onChange={handleChange("inventorySource")}
        >
          {inventories.map((cat) =>
            cat.val === survey.inventorySource ? (
              <option value={cat.val} selected>
                {cat.display}
              </option>
            ) : (
              <option value={cat.val}>{cat.display}</option>
            )
          )}
        </select>
      </div>

      <div
        className="form-check"
        style={{ marginLeft: "20px", marginBottom: "5px" }}
      >
        <input
          type="checkbox"
          className="form-check-input"
          id="res1"
          onChange={handleStrataChecked("residentialStratification")}
          checked={survey.residentialStratification}
        />
        <label
          className="form-check-label"
          style={{ marginLeft: "5px", marginTop: "2px" }}
          htmlFor="res1"
        >
          Create a Strata of RES1 and All Other Occupancy types
        </label>
      </div>

      <div
        className="form-check"
        style={{ marginLeft: "20px", marginBottom: "5px" }}
      >
        <input
          type="checkbox"
          className="form-check-input"
          id="floodzone"
          onChange={handleStrataChecked("floodzoneStratification")}
          checked={survey.floodzoneStratification}
        />
        <label
          className="form-check-label"
          style={{ marginLeft: "5px", marginTop: "2px" }}
          htmlFor="floodzone"
        >
          Create a Strata for floodzones A,V and All other zones
        </label>
      </div>
      <div>
        <div style={{ display: "flex" }}>
          <label style={{ flexGrow: 1 }}>Confidence</label>
          <a
            target="_blank"
            title="Help for Confidence"
            href={`${fwLinkHost}nsi-survey-tool-damage-categories`}
          >
            <i className="mdi mdi-help-circle-outline" />
          </a>
        </div>
        <select
          className="form-control st-input"
          id="confidence"
          onChange={handleChange("confidence")}
        >
          {confidence.map((ele) =>
            ele.val == survey.confidence ? (
              <option value={ele.val} selected>
                {ele.display}
              </option>
            ) : (
              <option value={ele.val}>{ele.display}</option>
            )
          )}
        </select>
        <div style={{ display: "flex" }}>
          <label style={{ flexGrow: 1 }}>Margin</label>
          <a
            target="_blank"
            title="Help for Margin"
            href={`${fwLinkHost}nsi-survey-tool-damage-categories`}
          >
            <i className="mdi mdi-help-circle-outline" />
          </a>
        </div>
        <select
          className="form-control st-input"
          id="margin"
          onChange={handleChange("margin")}
        >
          {margin.map((ele) =>
            ele.val == survey.margin ? (
              <option value={ele.val} selected>
                {ele.display}
              </option>
            ) : (
              <option value={ele.val}>{ele.display}</option>
            )
          )}
        </select>
        <div style={{ display: "flex" }}>
          <label style={{ flexGrow: 1 }}>Proportion</label>
          <a
            target="_blank"
            title="Help for Population Proportion"
            href={`${fwLinkHost}nsi-survey-tool-damage-categories`}
          >
            <i className="mdi mdi-help-circle-outline" />
          </a>
        </div>
        <select
          className="form-control st-input"
          id="proportion"
          onChange={handleChange("proportion")}
        >
          {proportion.map((ele) =>
            ele.val == survey.proportion ? (
              <option value={ele.val} selected>
                {ele.display}
              </option>
            ) : (
              <option value={ele.val}>{ele.display}</option>
            )
          )}
        </select>
        <div className="form-group">
          <div style={{ display: "flex" }}>
            <label style={{ flexGrow: 1 }}>Sample Size</label>
          </div>
          <input
            type="text"
            value={survey.sampleSize}
            className="form-control st-input"
            id="sampleSize"
            placeholder=""
            onChange={handleChange("sampleSize")}
          />
        </div>
      </div>
      <div></div>
      <div className="w-[50%]">
        <div className="mb-3">
          <Field>
            <Label>
              Select the Polygon You want to use to select structures to
              stratify.
            </Label>
            <Input type="file" />
          </Field>
        </div>
      </div>
    </div>
  );
}
