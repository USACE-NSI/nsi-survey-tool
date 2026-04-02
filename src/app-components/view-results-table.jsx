import React from "react";
import { useConnect } from "redux-bundler-hook";
import Tooltip from "@mui/material/Tooltip";

export default function ViewResultsTable() {
  const { survey, surveyResults } = useConnect(
    "selectSurvey",
    "selectSurveyResults"
  );

  const { results = [] } = survey;
  const { userNameFilter, fieldFilter } = surveyResults;

  // Define all fields from your handleFileUpload mapping
  const columnMapping = [
    { key: "srId", label: "SR ID" },
    { key: "userId", label: "User ID" },
    { key: "userName", label: "User Name" },
    { key: "completed", label: "Comp." },
    { key: "isControl", label: "Ctrl" },
    { key: "saId", label: "SA ID" },
    { key: "fdId", label: "FD ID" },
    { key: "x", label: "X" },
    { key: "y", label: "Y" },
    { key: "invalidStructure", label: "Invalid" },
    { key: "noStreetView", label: "No SV" },
    { key: "cbfips", label: "CBFIPS" },
    { key: "occtype", label: "Occ Type" },
    { key: "stDamcat", label: "Dam Cat" },
    { key: "foundHt", label: "Found Ht" },
    { key: "numStory", label: "Stories" },
    { key: "sqft", label: "SqFt" },
    { key: "foundType", label: "Found Type" },
    { key: "rsmeansType", label: "RSMeans" },
    { key: "quality", label: "Quality" },
    { key: "constType", label: "Const Type" },
    { key: "garage", label: "Garage" },
    { key: "roofStyle", label: "Roof Style" },
  ];
  // 1. Get the current filter key
  const activeKey = fieldFilter?.field || "All Fields";

  // 2. Determine which columns to show
  const visibleColumns =
    activeKey === "All Fields"
      ? columnMapping // Show everything
      : columnMapping.filter(
          (col) => col.key === "srId" || col.key === activeKey
        ); // Show just SR ID + Active

  // 1. Filter results based on the sidebar selection
  const filteredResults =
    userNameFilter && userNameFilter !== "All Surveyors"
      ? results.filter((r) => r.userName === userNameFilter)
      : results;
  console.log("--- Debug Survey Data ---");
  console.log("Filter Active:", surveyResults.userNameFilter);
  console.log("Total Results in Store:", results.length);
  console.log("Filtered Results Count:", filteredResults.length);
  if (results.length > 0) {
    console.log("First record 'userName' value:", results[0].userName);
  }
  if (filteredResults.length === 0) {
    return <div className="gw-p-4">No data available for this selection.</div>;
  }

  const renderValue = (val) => {
    if (typeof val === "boolean") return val ? "Yes" : "No";
    return val ?? "-";
  };
  const copyToClipboard = () => {
    // 1. Create Header Row
    const headers = visibleColumns.map((col) => col.label).join(",");

    // 2. Create Data Rows
    const csvRows = filteredResults.map((row) =>
      visibleColumns
        .map((col) => {
          const val = row[col.key] ?? "";
          // Escape quotes and wrap in quotes to handle commas within data
          const escaped = ("" + val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    );

    // 3. Combine and Copy
    const csvString = [headers, ...csvRows].join("\n");
    navigator.clipboard.writeText(csvString).then(() => {
      alert("Table copied to clipboard as CSV!");
    });
  };
  return (
    <div className="gw-p-4">
      {/* 
          Note: Use overflow-auto and a max-height to handle 20+ columns 
          and long lists of results effectively. 
      */}

      <div className="gw-flex gw-items-center gw-gap-3 gw-mb-4">
        <h3 className="gw-text-sm gw-font-bold gw-text-slate-700 gw-uppercase gw-tracking-wide">
          {` Viewing Results filtered by ${fieldFilter?.display} for ${userNameFilter}`}
        </h3>

        <Tooltip title="Copy visible columns to clipboard as CSV">
          <button
            onClick={copyToClipboard}
            className="gw-flex gw-items-center gw-gap-1 gw-px-2 gw-py-1 gw-text-[10px] gw-font-bold gw-uppercase gw-text-gray-600 gw-bg-white gw-border gw-border-slate-200 gw-rounded-md hover:gw-bg-slate-50 hover:gw-text-blue-600 hover:gw-border-blue-200 gw-transition-all gw-shadow-sm"
          >
            <i className="mdi mdi-content-copy gw-text-sm" />
            Copy CSV
          </button>
        </Tooltip>
      </div>
      <div className="gw-overflow-auto gw-max-h-[70vh] gw-shadow-md gw-rounded-lg gw-border">
        <table className="gw-min-w-full gw-divide-y gw-divide-gray-200">
          <thead className="gw-bg-gray-50 gw-sticky gw-top-0">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="gw-px-3 gw-py-2 gw-text-left gw-text-[10px] gw-font-bold gw-text-gray-600 gw-uppercase gw-tracking-wider gw-border-r"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="gw-bg-white gw-divide-y gw-divide-gray-200">
            {filteredResults.map((row, idx) => (
              <tr key={`${row.srId}-${idx}`} className="hover:gw-bg-blue-50">
                {visibleColumns.map((col) => (
                  <td
                    key={`${idx}-${col.key}`}
                    className={`gw-px-3 gw-py-1 gw-whitespace-nowrap gw-text-xs gw-border-r ${
                      col.key === activeKey
                        ? "gw-bg-blue-50 gw-font-semibold"
                        : ""
                    }`}
                  >
                    {renderValue(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="gw-mt-2 gw-text-xs gw-text-gray-500">
        Total Records: {filteredResults.length}
      </div>
    </div>
  );
}
