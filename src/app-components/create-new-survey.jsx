/*import { Button, Checkboxes } from "@usace/groundwork";
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
}*/
import { Button } from "@usace/groundwork";
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
    const s = { ...survey, [field]: e.target.value };
    doUpdateSurvey(s);
  };

  const handleCheckedChange = (field) => (e) => {
    const s = { ...survey, [field]: e.target.checked };
    doUpdateSurvey(s);
  };

  const isInvalid =
    !survey.name ||
    !survey.description ||
    !survey.owner ||
    !survey.dueDate ||
    !survey.members ||
    survey.members.length === 0;

  return (
    <div className="gw-p-10 gw-max-w-4xl gw-mx-auto">
      {/* Header Section */}
      <div className="gw-mb-8">
        <h1 className="gw-text-2xl gw-font-bold gw-text-slate-800">
          Create New Survey
        </h1>
        <p className="gw-text-slate-500">
          Fill out the details below to initialize a new survey instance.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="gw-bg-white gw-rounded-lg gw-shadow-md gw-border gw-border-slate-200 gw-p-8 gw-space-y-6">
        {/* Basic Info Section */}
        <div className="gw-grid gw-grid-cols-1 md:gw-grid-cols-2 gw-gap-6">
          <div className="gw-flex gw-flex-col gw-gap-2">
            <label className="gw-font-semibold gw-text-sm gw-text-slate-700">
              Survey Name
            </label>
            <input
              type="text"
              value={survey.name}
              className="gw-border gw-border-slate-300 gw-rounded gw-p-2 focus:gw-ring-2 focus:gw-ring-blue-500 gw-outline-none"
              onChange={handleChange("name")}
              placeholder="e.g. Infrastructure Assessment 2024"
            />
          </div>

          <div className="gw-flex gw-flex-col gw-gap-2">
            <label className="gw-font-semibold gw-text-sm gw-text-slate-700">
              Due Date
            </label>
            <input
              type="date"
              value={survey.dueDate}
              className="gw-border gw-border-slate-300 gw-rounded gw-p-2 focus:gw-ring-2 focus:gw-ring-blue-500 gw-outline-none"
              onChange={handleChange("dueDate")}
            />
          </div>

          <div className="gw-col-span-full gw-flex gw-flex-col gw-gap-2">
            <label className="gw-font-semibold gw-text-sm gw-text-slate-700">
              Description
            </label>
            <textarea
              value={survey.description}
              rows="2"
              className="gw-border gw-border-slate-300 gw-rounded gw-p-2 focus:gw-ring-2 focus:gw-ring-blue-500 gw-outline-none"
              onChange={handleChange("description")}
              placeholder="Provide a brief overview of the survey goals..."
            />
          </div>
        </div>

        <hr className="gw-border-slate-100" />

        {/* Member Table Section */}
        <div>
          <label className="gw-font-semibold gw-text-sm gw-text-slate-700 gw-mb-4 gw-block">
            Survey Members
          </label>
          <div className="gw-bg-slate-50 gw-rounded-md gw-border gw-border-slate-200">
            <MemberTable />
          </div>
        </div>

        <hr className="gw-border-slate-100" />

        {/* Strategy Section */}
        <div className="gw-bg-slate-50 gw-p-4 gw-rounded-md gw-border gw-border-slate-200">
          <div className="gw-flex gw-items-center gw-gap-3 gw-mb-4">
            <input
              type="checkbox"
              className="gw-w-4 gw-h-4"
              id="surveytype"
              onChange={handleCheckedChange("createStratifiedSurvey")}
              checked={survey.createStratifiedSurvey}
            />
            <label
              htmlFor="surveytype"
              className="gw-font-medium gw-text-slate-700"
            >
              Generate Stratified Survey
            </label>
          </div>

          <div className="gw-mt-2">
            {survey.createStratifiedSurvey ? (
              <GenerateStratifiedSurvey />
            ) : (
              <LoadSurveyCSV />
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="gw-flex gw-justify-end gw-pt-4">
          <div className="gw-w-full md:gw-w-64">
            <Button
              color="secondary"
              size="xl"
              disabled={isInvalid}
              className={`gw-w-full gw-py-3 gw-rounded-md gw-font-bold gw-transition-colors ${
                isInvalid
                  ? "gw-bg-gray-600 gw-text-white"
                  : "gw-bg-red-600 hover:gw-bg-red-600/90 gw-text-white"
              }`}
              onClick={handleCreateSurvey}
            >
              Confirm & Create Survey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
