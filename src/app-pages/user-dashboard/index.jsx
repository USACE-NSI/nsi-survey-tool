import React, { useState, useEffect } from "react";
import { useConnect } from "redux-bundler-hook";
import SurveyStatusTable from "../../app-components/survey-status-table";
import ViewActiveSurveys from "../../app-components/view-active-surveys";
import CreateNewSurvey from "../../app-components/create-new-survey";
import { Button } from "@usace/groundwork";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ManageSurvey from "../../app-components/manage-survey";
import ViewCompletedSurveys from "../../app-components/view-completed-surveys";

export default function UserDashboard() {
  const [trayWidth, setTrayWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const { user, dashboard, doUpdateDashboardView, doCreateNewSurvey } =
    useConnect(
      "selectUser",
      "selectDashboard",
      "doUpdateDashboardView",
      "doCreateNewSurvey"
    );
  const openCreateNew = () => {
    console.log("opening create new surveys");
    console.log("Current Dashboard State:", dashboard);
    doCreateNewSurvey();
    doUpdateDashboardView({
      viewCreateNew: true,
      viewManage: false,
      viewActive: false,
      viewCompleted: false,
    });
    //doUpdateUrl('/create-new-survey')
  };
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const minWidth = 300;
      const maxWidth = window.innerWidth / 3;
      // Clamp the width between 300 and 1/3 of the screen
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);

      setTrayWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="gw-flex gw-h-screen">
      <div
        style={{
          width: `${trayWidth}px`,
          position: "relative",
          paddingRight: "10px",
        }}
        className="gw-flex-none gw-border-r"
      >
        <Button
          size="xl"
          disabled={!user.canCreateNewSurvey}
          className="gw-w-full gw-flex gw-items-center gw-justify-center gw-whitespace-nowrap bg-secondary border-r border-white/20 px-4 py-2 first:rounded-l-md last:rounded-r-md st-btn-tb2"
          onClick={openCreateNew}
        >
          Create New Survey
          <AddCircleIcon
            style={{ fontSize: "20px", verticalAlign: "middle" }}
          />
        </Button>
        <div>
          <SurveyStatusTable />
        </div>

        {/* The clickable grabber */}
        <div
          onMouseDown={() => setIsResizing(true)}
          style={{
            position: "absolute",
            top: 0,
            right: "-4px",
            width: "8px",
            height: "100%",
            cursor: "col-resize",
            zIndex: 10,
            backgroundColor: isResizing ? "#2d96ff" : "transparent",
          }}
        />
      </div>

      <div className="gw-flex-1">
        {dashboard.viewActive && <ViewActiveSurveys />}
        {dashboard.viewCompleted && <ViewCompletedSurveys />}
        {dashboard.viewManage && <ManageSurvey />}
        {dashboard.viewCreateNew && <CreateNewSurvey />}
      </div>
    </div>
  );
}
