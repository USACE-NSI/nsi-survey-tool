import React, { useState, useEffect } from "react";
import { useConnect } from "redux-bundler-hook";
import Papa from "papaparse";
import ViewResultsBar from "../../app-components/view-results-bar";
import ViewResultsPie from "../../app-components/view-results-pie";
import ViewResultsTable from "../../app-components/view-results-table";
import { Field, Input, Label } from "@usace/groundwork";

export default function SurveyResultsAnalysis() {
  const [trayWidth, setTrayWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const fwLinkHost = " https://www.hec.usace.army.mil/fwlink/?linkid=";
  const { survey, surveyResults, doUpdateSurvey, doUpdateSurveyResults } =
    useConnect(
      "selectSurvey",
      "selectSurveyResults",
      "doUpdateSurvey",
      "doUpdateSurveyResults"
    );
  const viewState = ["table", "pie", "bar"];
  const toBool = (val) => {
    if (typeof val === "boolean") return val;
    const s = String(val).toLowerCase().trim();
    return ["true", "1", "yes", "t", "y"].includes(s);
  };
  const updateViewState = () => (e) => {
    let val = e.target.value;
    console.log("Current view State:", surveyResults);
    let t = false;
    let p = false;
    let b = false;
    switch (val) {
      case "table":
        t = true;
        break;
      case "pie":
        p = true;
        break;
      case "bar":
        b = true;
        break;
      default:
        t = true;
    }
    doUpdateSurveyResults({
      viewTable: t,
      viewPie: p,
      viewBar: b,
    });
  };
  const handleChange = (field) => (e) => {
    let val = e.target.value;
    console.log(field + " " + val);
    const s = { ...surveyResults, [field]: val };
    doUpdateSurveyResults(s);
  };
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const newResults = [
            ...survey.results,
            ...results.data.map((row) => ({
              srId: row.srId,
              userId: row.userId,
              userName: row.userName,
              completed: toBool(row.completed),
              isControl: toBool(row.isControl),
              saId: row.saId,
              fdId: row.fdId,
              x: row.x,
              y: row.y,
              invalidStructure: toBool(row.invalidStructure),
              noStreetView: toBool(row.noStreetView),
              cbfips: row.cbfips,
              occtype: row.occtype,
              stDamcat: row.stDamcat,
              foundHt: row.foundHt,
              numStory: row.numStory,
              sqft: row.sqft,
              foundType: row.foundType,
              rsmeansType: row.rsmeansType,
              quality: row.quality,
              constType: row.constType,
              garage: row.garage,
              roofStyle: row.roofStyle,
            })),
          ];

          const updatedSurvey = {
            ...survey,
            results: newResults,
          };
          doUpdateSurvey(updatedSurvey);
        },
      });
    }
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
        <div style={{ display: "flex" }}>
          <label style={{ flexGrow: 1 }}>Plot Type</label>
          <a
            target="_blank"
            title="Help for view state"
            href={`${fwLinkHost}nsi-survey-tool-damage-categories`}
          >
            <i className="mdi mdi-help-circle-outline" />
          </a>
        </div>
        <select
          className="form-control st-input"
          id="viewState"
          onChange={updateViewState()}
        >
          {viewState.map((ele) =>
            ele == surveyResults.viewState ? (
              <option selected>{ele}</option>
            ) : (
              <option>{ele}</option>
            )
          )}
        </select>
        <div style={{ marginTop: "15px" }}>
          <div style={{ display: "flex" }}>
            <label style={{ flexGrow: 1 }}>Survey Filter</label>
          </div>
          <select
            className="form-control st-input"
            id="surveyor"
            // Ensure we fallback to your default string if state is empty
            value={surveyResults.userNameFilter || "All Surveyors"}
            onChange={handleChange("userNameFilter")}
          >
            <option value="All Surveyors">All Surveyors</option>
            {survey.members &&
              survey.members.map((ele) => (
                <option key={ele} value={ele}>
                  {ele}
                </option>
              ))}
          </select>
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
      <div>
        <div>
          <div>Select the CSV you want to use to define survey results</div>
          <div className="w-[50%]">
            <div className="mb-3">
              <Field>
                <Label>Choose a .csv file containing survey results</Label>
                <Input type="file" accept=".csv" onChange={handleFileUpload} />
              </Field>
            </div>
          </div>
        </div>
        <div className="gw-flex-1">
          {surveyResults.viewTable && <ViewResultsTable />}
          {surveyResults.viewPie && <ViewResultsPie />}
          {surveyResults.viewBar && <ViewResultsBar />}
        </div>
      </div>
    </div>
  );
}
