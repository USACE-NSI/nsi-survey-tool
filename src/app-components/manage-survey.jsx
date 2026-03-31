import { Button, Checkboxes } from "@usace/groundwork";
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
    //doUpdateCreateNewSurvey()
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
      doRestartSurvey(survey); ///i think this creates a bug of adding to the active surveys
    }
  };
  const handleCheckedChange = (field) => (e) => {
    let val = e.target.checked;
    console.log(field + " " + val);
    const s = { ...survey, [field]: val };
    doUpdateSurvey(s);
  };
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
          readOnly="readonly"
        />
      </div>
      <div className="form-group">
        <div style={{ display: "flex" }}>
          <label style={{ flexGrow: 1 }}>Survey Owner</label>
        </div>
        <input
          type="text"
          value={survey.owner}
          className="form-control st-input"
          id="owner"
          placeholder=""
          readOnly="readonly"
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
          readOnly="readonly"
        />
      </div>

      <div>
        <MemberTable />
      </div>

      <div style={{ width: "230px" }}>
        <div div style={{ margin: "15px" }}>
          <input
            type="checkbox"
            className="form-check-input"
            id="surveystatus"
            onChange={handleCheckedChange("completed")}
            checked={survey.completed}
          />
          <label
            className="form-check-label"
            style={{ marginLeft: "5px", marginTop: "2px" }}
            htmlFor="surveystatus"
          >
            Mark Survey Complete
          </label>
        </div>
        <Button
          size="xl"
          className="gw-w-full gw-flex gw-items-center gw-justify-center gw-whitespace-nowrap bg-secondary border-r border-white/20 px-4 py-2 first:rounded-l-md last:rounded-r-md st-btn-tb2"
          onClick={handleUpdateSurvey}
        >
          Update Survey
        </Button>
        <Button
          size="xl"
          className="gw-w-full gw-flex gw-items-center gw-justify-center gw-whitespace-nowrap border-r border-white/20 px-4 py-2 first:rounded-l-md last:rounded-r-md st-btn-tb-delete"
          onClick={handleUpdateSurvey}
        >
          Delete Survey
        </Button>
      </div>
    </div>
  );
}
