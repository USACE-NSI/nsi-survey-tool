import React from "react";
import { useConnect } from "redux-bundler-hook";

export default function ViewResultsTable() {
  const { survey, surveyResults } = useConnect(
    "selectSurvey",
    "selectSurveyResults"
  );

  const { results = [] } = survey;
  const { userNameFilter } = surveyResults;

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

  return (
    <div className="gw-p-4">
      {/* 
          Note: Use overflow-auto and a max-height to handle 20+ columns 
          and long lists of results effectively. 
      */}
      <div className="gw-overflow-auto gw-max-h-[70vh] gw-shadow-md gw-rounded-lg gw-border">
        <table className="gw-min-w-full gw-divide-y gw-divide-gray-200">
          <thead className="gw-bg-gray-50 gw-sticky gw-top-0">
            <tr>
              {columnMapping.map((col) => (
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
                {columnMapping.map((col) => (
                  <td
                    key={`${idx}-${col.key}`}
                    className="gw-px-3 gw-py-1 gw-whitespace-nowrap gw-text-xs gw-text-gray-700 gw-border-r"
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
