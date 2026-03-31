import { Button, Checkboxes } from "@usace/groundwork";
import { useConnect } from "redux-bundler-hook";
import { useEffect } from "react";
import LoadSurveyCSV from "./load-survey-csv";
import GenerateStratifiedSurvey from "./generate-stratified-survey";
import MemberTable from "./member-table";

export default function CreateNewSurvey() {
  const {
    user,
    survey,
    doUpdateSurvey,
    doUpdateSurveyGUID,
    doAddSurvey,
    doUpdateDashboardView,
  } = useConnect(
    "selectUser",
    "selectSurvey",
    "doUpdateSurvey",
    "doUpdateSurveyGUID",
    "doAddSurvey",
    "doUpdateDashboardView"
  );
  useEffect(() => {
    doUpdateSurveyGUID();
    doUpdateSurvey({ owner: user.name });
  }, []);
  const handleCreateSurvey = () => {
    doUpdateSurvey(survey);
    doAddSurvey(survey);
    doUpdateDashboardView({
      viewCreateNew: false,
      viewManage: false,
      viewActive: true,
      viewCompleted: false,
    });
  };
  const handleChange = (field) => (e) => {
    let val = e.target.value;
    console.log(field + " " + val);
    const s = { ...survey, [field]: val };
    doUpdateSurvey(s);
  };
  const handleCheckedChange = (field) => (e) => {
    let val = e.target.checked;
    console.log(field + " " + val);
    const s = { ...survey, [field]: val };
    doUpdateSurvey(s);
  };
  const isInvalid =
    !survey.name ||
    !survey.description ||
    !survey.owner ||
    !survey.dueDate ||
    !survey.members ||
    survey.members.length === 0; // Check for at least one member
  //@TODO ensure that the survey size is greater than 1 after we implment the ability to generate a stratified survey.
  return (
    <div style={{ padding: "50px" }}>
      <div className="form-group">
        <div style={{ display: "flex" }}>
          <label style={{ flexGrow: 1 }}>Survey Name</label>
        </div>
        <input
          type="text"
          value={survey.name}
          className="form-control st-input"
          id="name"
          placeholder=""
          onChange={handleChange("name")}
        />
      </div>
      <div className="form-group">
        <div style={{ display: "flex" }}>
          <label style={{ flexGrow: 1 }}>Survey Description</label>
        </div>
        <input
          type="text"
          value={survey.description}
          className="form-control st-input"
          id="description"
          placeholder=""
          onChange={handleChange("description")}
        />
      </div>
      <div className="form-group">
        <div style={{ display: "flex" }}>
          <label style={{ flexGrow: 1 }}>Survey Owner</label>
        </div>
        <input
          type="text"
          value={survey.owner ? survey.owner : user.name}
          className="form-control st-input"
          id="owner"
          placeholder=""
          onChange={handleChange("owner")}
        />
      </div>
      <div className="form-group">
        <div style={{ display: "flex" }}>
          <label style={{ flexGrow: 1 }}>Due Date</label>
        </div>
        <input
          type="date"
          value={survey.dueDate}
          className="form-control st-input"
          id="dueDate"
          placeholder=""
          onChange={handleChange("dueDate")}
        />
      </div>
      <div className="form-group">
        <MemberTable />
        <div>
          <input
            type="checkbox"
            className="form-check-input"
            id="surveytype"
            onChange={handleCheckedChange("createStratifiedSurvey")}
            checked={survey.createStratifiedSurvey}
          />
          <label
            className="form-check-label"
            style={{ marginLeft: "5px", marginTop: "2px" }}
            htmlFor="surveytype"
          >
            Generate Stratified Survey
          </label>
          <div className="gw-flex-1">
            {survey.createStratifiedSurvey && <GenerateStratifiedSurvey />}
            {!survey.createStratifiedSurvey && <LoadSurveyCSV />}
          </div>
        </div>
      </div>
      <div style={{ width: "230px" }}>
        <Button
          size="xl"
          disabled={isInvalid}
          className="gw-w-full gw-flex gw-items-center gw-justify-center gw-whitespace-nowrap bg-secondary border-r border-white/20 px-4 py-2 first:rounded-l-md last:rounded-r-md st-btn-tb2"
          onClick={handleCreateSurvey}
        >
          Create Survey
        </Button>
      </div>
    </div>
  );
}
