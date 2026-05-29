import { Button } from "@usace/groundwork";
import { useConnect } from "redux-bundler-hook";
import { useEffect } from "react";
import LoadSurveyCSV from "./load-survey-csv";
import GenerateStratifiedSurvey from "./generate-stratified-survey";
import MemberTable from "./member-table";

export default function CreateNewSurvey() {
  const {
    authUsername,
    survey,
    doUpdateSurvey,
    doUpdateSurveyGUID,
    doPostNewSurvey,
    doUpdateDashboardView,
  } = useConnect(
    "selectAuthUsername",
    "selectSurvey",
    "doUpdateSurvey",
    "doUpdateSurveyGUID",
    "doPostNewSurvey",
    "doUpdateDashboardView",
  );

  useEffect(() => {
    doUpdateSurveyGUID();
    // 1. Add current user as both a member and an owner by default
    const initialMembers = survey.members || [];
    const initialOwners = survey.owners || [];

    const newMembers = initialMembers.includes(authUsername)
      ? initialMembers
      : [...initialMembers, authUsername];

    const newOwners = initialOwners.includes(authUsername)
      ? initialOwners
      : [...initialOwners, authUsername];

    doUpdateSurvey({
      members: newMembers,
      owners: newOwners,
    });
  }, []);

  const handleCreateSurvey = () => {
    doPostNewSurvey(survey, {
      onSuccess: () => {
        doUpdateDashboardView({
          viewCreateNew: false,
          viewManage: false,
          viewActive: true,
          viewCompleted: false,
        });
      },
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
    !survey.dueDate ||
    !survey.members ||
    survey.members.length === 0 ||
    !survey.owners ||
    survey.owners.length === 0 ||
    !survey.perimeterGeometry;

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
