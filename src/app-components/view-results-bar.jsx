import React from "react";
import { useConnect } from "redux-bundler-hook";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

export default function ViewResultsBar() {
  // Access state from the store
  const { survey, surveyResults } = useConnect(
    "selectSurvey",
    "selectSurveyResults"
  );

  const { results = [] } = survey;
  const { userNameFilter } = surveyResults;

  // 1. Filter results based on the sidebar surveyor selection
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
  // 2. Aggregate data (Example: Grouping by 'occtype' - Occupancy Type)
  const aggregation = filteredResults.reduce((acc, curr) => {
    const type = curr.occtype || "Unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(aggregation),
    datasets: [
      {
        label: "Number of Structures",
        data: Object.values(aggregation),
        backgroundColor: "rgba(54, 162, 235, 0.7)", // Light blue fill
        borderColor: "rgb(54, 162, 235)", // Solid blue border
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // Hide legend for single dataset bars
      title: {
        display: true,
        text: `Occupancy Types: ${userNameFilter || "All Surveyors"}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Count" },
      },
      x: {
        title: { display: true, text: "Occupancy Type" },
      },
    },
  };

  if (filteredResults.length === 0) {
    return <div className="p-4">No data available for this selection.</div>;
  }

  return (
    <div style={{ height: "500px", width: "100%", padding: "20px" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
