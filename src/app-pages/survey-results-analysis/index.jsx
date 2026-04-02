import React, { useState, useEffect } from "react";
import { useConnect } from "redux-bundler-hook";
import Papa from "papaparse";
import ViewResultsBar from "../../app-components/view-results-bar";
import ViewResultsPie from "../../app-components/view-results-pie";
import ViewResultsTable from "../../app-components/view-results-table";
import HelpLink from "../../app-components/help-link";
import { Button } from "@usace/groundwork";
import TableChartIcon from "@mui/icons-material/TableChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import Tooltip from "@mui/material/Tooltip";

export default function SurveyResultsAnalysis() {
  const [trayWidth, setTrayWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  const { survey, surveyResults, doUpdateSurvey, doUpdateSurveyResults } =
    useConnect(
      "selectSurvey",
      "selectSurveyResults",
      "doUpdateSurvey",
      "doUpdateSurveyResults"
    );
  const fieldFilter = [
    { field: "All Fields", fieldType: "mixed", display: "All Fields" },
    { field: "completed", fieldType: "catagorical", display: "Completed" },
    { field: "isControl", fieldType: "catagorical", display: "Control" },
    { field: "x", fieldType: "continuous", display: "X" },
    { field: "y", fieldType: "continuous", display: "Y" },
    {
      field: "invalidStructure",
      fieldType: "catagorical",
      display: "Invalid",
    },
    {
      field: "noStreetView",
      fieldType: "catagorical",
      display: "Street View",
    },
    { field: "occtype", fieldType: "catagorical", display: "OccupancyType" },
    {
      field: "stDamcat",
      fieldType: "catagorical",
      display: "Damage Category",
    },
    {
      field: "foundHt",
      fieldType: "continuous",
      display: "Foundation Height",
    },
    {
      field: "numStory",
      fieldType: "continuous",
      display: "Number of Stories",
    },
    { field: "sqft", fieldType: "continuous", display: "Square Footage" },
    {
      field: "foundType",
      fieldType: "catagorical",
      display: "Foundation Type",
    },
    {
      field: "rsmeansType",
      fieldType: "catagorical",
      display: "Replacement Type",
    },
    { field: "quality", fieldType: "catagorical", display: "Quality" },
    {
      field: "constType",
      fieldType: "catagorical",
      display: "Construction Type",
    },
    { field: "garage", fieldType: "catagorical", display: "Garage" },
    { field: "roofStyle", fieldType: "catagorical", display: "Roof" },
  ];
  const updateViewState = (type) => {
    doUpdateSurveyResults({
      ...surveyResults,
      viewTable: type === "table",
      viewPie: type === "pie",
      viewBar: type === "bar",
      viewState: type, // tracking string for the active button state
    });
  };
  const toBool = (val) => {
    if (typeof val === "boolean") return val;
    const s = String(val).toLowerCase().trim();
    return ["true", "1", "yes", "t", "y"].includes(s);
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
    <div className="gw-flex gw-h-screen gw-bg-slate-50">
      {/* 1. Left Filter & Controls Tray */}
      <div
        style={{ width: `${trayWidth}px` }}
        className="gw-relative gw-flex-none gw-bg-white gw-border-r gw-border-slate-200 gw-shadow-sm gw-z-20"
      >
        <div className="gw-p-6 gw-space-y-8">
          <div>
            <h2 className="gw-text-lg gw-font-bold gw-text-slate-800 gw-mb-1">
              Analysis Tools
            </h2>
            <p className="gw-text-xs gw-text-slate-500">
              Configure your data view and filters.
            </p>
          </div>

          {/* View State Toggle Group */}
          <div className="gw-space-y-3">
            <div className="gw-flex gw-items-center">
              <label className="gw-text-xs gw-font-bold gw-text-slate-400 gw-uppercase gw-tracking-wider gw-flex-grow">
                Visualization
              </label>
              <HelpLink id="view-state-help" />
            </div>
            <div className="gw-flex gw-rounded-md gw-shadow-sm gw-border gw-border-slate-200 gw-overflow-hidden">
              <Tooltip title="View Table">
                <button
                  onClick={() => updateViewState("table")}
                  className={`gw-flex-1 gw-py-2 gw-flex gw-justify-center ${
                    surveyResults.viewTable
                      ? "gw-bg-gray-600 gw-text-white"
                      : "gw-bg-white gw-text-gray-600 hover:gw-bg-slate-50"
                  }`}
                >
                  <TableChartIcon fontSize="small" />
                </button>
              </Tooltip>
              <Tooltip title="View Pie Chart">
                <button
                  onClick={() => updateViewState("pie")}
                  className={`gw-flex-1 gw-py-2 gw-border-l gw-border-r gw-border-slate-200 gw-flex gw-justify-center ${
                    surveyResults.viewPie
                      ? "gw-bg-gray-600 gw-text-white"
                      : "gw-bg-white gw-text-gray-600 hover:gw-bg-slate-50"
                  }`}
                >
                  <PieChartIcon fontSize="small" />
                </button>
              </Tooltip>
              <Tooltip title="View Bar Chart">
                <button
                  onClick={() => updateViewState("bar")}
                  className={`gw-flex-1 gw-py-2 gw-flex gw-justify-center ${
                    surveyResults.viewBar
                      ? "gw-bg-gray-600 gw-text-white"
                      : "gw-bg-white gw-text-gray-600 hover:gw-bg-slate-50"
                  }`}
                >
                  <BarChartIcon fontSize="small" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Survey Filter */}
          <div className="gw-space-y-3">
            <label className="gw-text-xs gw-font-bold gw-text-slate-400 gw-uppercase gw-tracking-wider">
              Surveyor Filter
            </label>
            <select
              className="gw-w-full gw-border gw-border-slate-300 gw-rounded-md gw-p-2 gw-bg-white gw-text-sm focus:gw-ring-2 focus:gw-ring-blue-500"
              value={surveyResults.userNameFilter || "All Surveyors"}
              onChange={(e) =>
                doUpdateSurveyResults({
                  ...surveyResults,
                  userNameFilter: e.target.value,
                })
              }
            >
              <option value="All Surveyors">All Surveyors</option>
              {survey.members?.map((ele) => (
                <option key={ele} value={ele}>
                  {ele}
                </option>
              ))}
            </select>
          </div>
          {/* Field Filter */}
          <div className="gw-space-y-3">
            <label className="gw-text-xs gw-font-bold gw-text-slate-400 gw-uppercase gw-tracking-wider">
              Field Filter
            </label>
            <select
              className="gw-w-full gw-border gw-border-slate-300 gw-rounded-md gw-p-2 gw-bg-white gw-text-sm focus:gw-ring-2 focus:gw-ring-blue-500"
              value={surveyResults.fieldFilter.field || "All Fields"}
              onChange={(e) => {
                const selectedFieldKey = e.target.value;
                // Find the full object from your fieldFilter array
                const selectedObject = fieldFilter.find(
                  (f) => f.field === selectedFieldKey
                );

                doUpdateSurveyResults({
                  ...surveyResults,
                  fieldFilter: selectedObject,
                });
              }}
            >
              {fieldFilter?.map((ele) => (
                <option key={ele.field} value={ele.field}>
                  {ele.display}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* The Resizer Grabber */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className={`gw-absolute gw-top-0 gw-right-[-2px] gw-w-[4px] gw-h-full gw-cursor-col-resize gw-transition-colors ${
            isResizing ? "gw-bg-blue-500" : "hover:gw-bg-slate-300"
          }`}
        />
      </div>

      {/* 2. Main Stage */}
      <div className="gw-flex-1 gw-overflow-auto gw-p-8">
        {/* This should be removed once we give the ability to fetch results from the database/api @TODO make sure that results can be fetched. */}
        {(!survey.results || survey.results.length === 0) && (
          <div className="gw-relative gw-group">
            <div className="gw-border-2 gw-border-dashed gw-border-slate-300 gw-rounded-lg gw-p-8 gw-text-center hover:gw-border-blue-400 hover:gw-bg-blue-50 gw-transition-all">
              <i className="mdi mdi-file-upload-outline gw-text-3xl gw-text-slate-400 gw-mb-2" />
              <p className="gw-text-sm gw-text-slate-600">
                Drag and drop your results<b>.csv</b> here or{" "}
                <span className="gw-text-blue-600 gw-font-semibold">
                  browse files
                </span>
              </p>
              <p className="gw-text-xs gw-text-slate-400 gw-mt-1">
                Required columns: srId, userId, userName, completed, isControl,
                saId, fdId, x, y, invalidStructure, noStreetView, cbfips,
                occtype, stDamcat, foundHt, numStory, sqft, foundType,
                rsmeansType, quality, constType, garage, roofStyle
              </p>
              <input
                type="file"
                accept=".csv"
                className="gw-absolute gw-inset-0 gw-opacity-0 gw-cursor-pointer"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        )}

        {/* Analysis Content */}
        <div className="gw-bg-white gw-rounded-xl gw-shadow-sm gw-border gw-border-slate-200 gw-min-h-full">
          {surveyResults.viewTable && <ViewResultsTable />}
          {surveyResults.viewPie && <ViewResultsPie />}
          {surveyResults.viewBar && <ViewResultsBar />}
        </div>
      </div>
    </div>
  );
}
