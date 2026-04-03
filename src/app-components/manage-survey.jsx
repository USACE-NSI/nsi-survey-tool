import { Button } from "@usace/groundwork";
import { useConnect } from "redux-bundler-hook";
import MemberTable from "./member-table";

export default function ManageSurvey() {
  const {
    survey,
    doUpdateSurvey,
    doUpdateDashboardView,
    doCompleteSurvey,
    doRestartSurvey,
  } = useConnect(
    "selectSurvey",
    "doUpdateSurvey",
    "doUpdateDashboardView",
    "doCompleteSurvey",
    "doRestartSurvey"
  );

  const handleUpdateSurvey = () => {
    if (isInvalid) return;
    doUpdateSurvey(survey);
    doUpdateDashboardView({
      viewCreateNew: false,
      viewManage: false,
      viewActive: true,
      viewCompleted: false,
    });

    if (survey.completed) {
      doCompleteSurvey(survey);
    } else {
      doRestartSurvey(survey);
    }
  };

  const handleCheckedChange = (field) => (e) => {
    const s = { ...survey, [field]: e.target.checked };
    doUpdateSurvey(s);
  };
  const isInvalid = !survey.owners || survey.owners.length === 0;
  return (
    <div className="gw-p-10 gw-max-w-4xl gw-mx-auto">
      {/* Header */}
      <div className="gw-mb-8 gw-flex gw-justify-between gw-items-end">
        <div>
          <h1 className="gw-text-2xl gw-font-bold gw-text-slate-800">
            Manage Survey
          </h1>
          <p className="gw-text-slate-500 font-mono gw-text-xs">
            ID: {survey.id}
          </p>
        </div>
        <div
          className={`gw-px-3 gw-py-1 gw-rounded-full gw-text-xs gw-font-bold ${
            survey.completed
              ? "gw-bg-green-100 gw-text-green-700"
              : "gw-bg-blue-100 gw-text-blue-700"
          }`}
        >
          {survey.completed ? "COMPLETED" : "ACTIVE"}
        </div>
      </div>

      {/* Management Card */}
      <div className="gw-bg-white gw-rounded-lg gw-shadow-md gw-border gw-border-slate-200 gw-overflow-hidden">
        {/* Read-Only Info Header */}
        <div className="gw-p-8 gw-bg-slate-50 gw-grid gw-grid-cols-1 md:gw-grid-cols-3 gw-gap-6 gw-border-b gw-border-slate-200">
          <div className="gw-flex gw-flex-col">
            <label className="gw-text-[10px] gw-font-bold gw-text-slate-400 gw-uppercase">
              Survey Name
            </label>
            <span className="gw-text-slate-700 gw-font-semibold">
              {survey.name}
            </span>
          </div>
          <div className="gw-flex gw-flex-col">
            <label className="gw-text-[10px] gw-font-bold gw-text-slate-400 gw-uppercase">
              Owner
            </label>
            <span className="gw-text-slate-700 gw-font-semibold">
              {survey.owners?.length > 0 ? (
                <>{survey.owners.join(", ")}</>
              ) : (
                <span className="gw-italic gw-text-slate-400">
                  None Assigned
                </span>
              )}
            </span>
          </div>
          <div className="gw-flex gw-flex-col">
            <label className="gw-text-[10px] gw-font-bold gw-text-slate-400 gw-uppercase">
              Due Date
            </label>
            <span className="gw-text-slate-700 gw-font-semibold">
              {survey.dueDate}
            </span>
          </div>
        </div>

        {/* Interactive Sections */}
        <div className="gw-p-8 gw-space-y-8">
          {/* Member Table */}
          <div>
            <label className="gw-font-semibold gw-text-sm gw-text-slate-700 gw-mb-4 gw-block">
              Assigned Surveyors
            </label>
            <div className="gw-border gw-border-slate-100 gw-rounded-md">
              <MemberTable />
            </div>
          </div>

          <hr className="gw-border-slate-100" />

          {/* Status and Actions */}
          <div className="gw-flex gw-flex-col md:gw-flex-row gw-justify-between gw-items-center gw-gap-3">
            {/* Completion Toggle */}
            <div className="gw-bg-slate-50 gw-border gw-border-slate-200 gw-rounded-md gw-p-4 gw-flex gw-items-center gw-gap-3">
              <input
                type="checkbox"
                className=" gw-cursor-pointer"
                id="surveystatus"
                onChange={handleCheckedChange("completed")}
                checked={survey.completed}
              />
              <label
                htmlFor="surveystatus"
                className="gw-text-sm gw-font-medium gw-text-slate-700 gw-cursor-pointer"
              >
                Mark survey as <b>Complete</b>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="gw-flex gw-gap-3 gw-w-full md:gw-w-auto">
              <Button
                disabled={isInvalid}
                className={`gw-px-6 gw-rounded-md
                ${
                  !isInvalid
                    ? "gw-bg-gray-600 hover:gw-bg-gray-600 gw-text-white"
                    : "gw-bg-red-600 gw-text-white"
                }`}
                onClick={handleUpdateSurvey}
              >
                Save Changes
              </Button>
              <Button
                className="gw-border-red-600 gw-bg-red-600 gw-text-white hover:gw-bg-red-600 gw-px-6 gw-rounded-md"
                onClick={() => {
                  /* add delete handler */
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
