import React from "react";
import { useConnect } from "redux-bundler-hook";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";

export default function ViewResultsPie() {
  // Pulling the survey data and the current filter from your store
  const { survey, surveyResults } = useConnect(
    "selectSurvey",
    "selectSurveyResults"
  );

  const { results = [] } = survey;
  const { userNameFilter } = surveyResults;

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
  // 2. Aggregate data (Example: Grouping by 'stDamcat')
  const aggregation = filteredResults.reduce((acc, curr) => {
    const category = curr.stDamcat || "Unspecified";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(aggregation),
    datasets: [
      {
        label: "Survey Count",
        data: Object.values(aggregation),
        backgroundColor: [
          "#36A2EB",
          "#FF6384",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#C9CBCF",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      title: {
        display: true,
        text: `Results for ${userNameFilter || "All Surveyors"}`,
      },
    },
  };

  if (filteredResults.length === 0) {
    return <div className="p-4">No data available for this selection.</div>;
  }

  return (
    <div style={{ height: "500px", width: "100%", padding: "20px" }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
