import React from "react";
import { useConnect } from "redux-bundler-hook";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
const getBinnedData = (data, field, numBins = 5) => {
  // 1. Separate special cases
  let nullCount = 0;
  let negativeCount = 0;
  const positiveValues = [];

  data.forEach((d) => {
    const val = d[field];
    if (val === null || val === undefined || val === "") {
      nullCount++;
    } else {
      const num = parseFloat(val);
      if (isNaN(num)) {
        nullCount++;
      } else if (num < 0) {
        negativeCount++;
      } else {
        positiveValues.push(num);
      }
    }
  });

  const bins = {};

  // 2. Add special bins if they have data
  if (nullCount > 0) bins["Null / N/A"] = nullCount;
  if (negativeCount > 0) bins["< 0"] = negativeCount;

  // 3. Process positive values into bins
  if (positiveValues.length > 0) {
    const min = Math.min(...positiveValues);
    const max = Math.max(...positiveValues);

    if (min === max) {
      bins[`${min}`] = positiveValues.length;
    } else {
      const range = max - min;
      const binSize = range / numBins;

      for (let i = 0; i < numBins; i++) {
        const low = Math.floor(min + i * binSize);
        const high =
          i === numBins - 1
            ? Math.ceil(max)
            : Math.floor(min + (i + 1) * binSize) - 1;

        const label = `${low}-${high}`;
        bins[label] = 0;

        // Count values for this specific bin
        positiveValues.forEach((val) => {
          let idx = Math.floor((val - min) / binSize);
          if (idx >= numBins) idx = numBins - 1;
          if (idx === i) bins[label]++;
        });
      }
    }
  }

  return bins;
};

export default function ViewResultsPie() {
  // Pulling the survey data and the current filter from your store
  const { survey, surveyResults } = useConnect(
    "selectSurvey",
    "selectSurveyResults"
  );

  const { results = [] } = survey;
  const { userNameFilter, fieldFilter } = surveyResults;
  const targetField = fieldFilter.field;
  const displayLabel = fieldFilter.display;

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
  // 2. Aggregate data Grouping by selected field type
  const isContinuous = fieldFilter?.fieldType === "continuous";

  const aggregation = isContinuous
    ? getBinnedData(filteredResults, targetField)
    : filteredResults.reduce((acc, curr) => {
        const val = curr[targetField] ?? "Unknown";
        acc[val] = (acc[val] || 0) + 1;
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
        text: `${displayLabel}: ${userNameFilter || "All Surveyors"}`,
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
