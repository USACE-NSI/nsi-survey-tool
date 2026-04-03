import React from "react";
import { useConnect } from "redux-bundler-hook";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

/**
 * Bins data into 100 percentiles for a smooth, performant CDF.
 */
const getBinnedCDFData = (data, field, numBins = 100) => {
  const values = data
    .map((d) => parseFloat(d[field]))
    .filter((val) => !isNaN(val) && val >= 0)
    .sort((a, b) => a - b);

  if (values.length === 0) return null;

  const binnedPoints = [];

  // Create points at fixed probability intervals (e.g., every 1%)
  for (let i = 0; i <= numBins; i++) {
    const probability = i / numBins;
    // Find the value at this percentile
    const index = Math.min(
      Math.floor(probability * (values.length - 1)),
      values.length - 1
    );

    binnedPoints.push({
      x: values[index],
      y: probability,
    });
  }

  return binnedPoints;
};

export default function ViewResultsCDF() {
  const { survey, surveyResults } = useConnect(
    "selectSurvey",
    "selectSurveyResults"
  );

  const { results = [] } = survey;
  const { userNameFilter, fieldFilter } = surveyResults;
  const targetField = fieldFilter.field;
  const displayLabel = fieldFilter.display;

  const filteredResults =
    userNameFilter && userNameFilter !== "All Surveyors"
      ? results.filter((r) => r.userName === userNameFilter)
      : results;

  // Use the new binned data helper
  const dataPoints = getBinnedCDFData(filteredResults, targetField);

  if (!dataPoints) {
    return (
      <div className="p-4 text-slate-500">
        No numerical data for {displayLabel}.
      </div>
    );
  }

  const chartData = {
    datasets: [
      {
        label: "Cumulative Probability",
        data: dataPoints,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        fill: true,
        tension: 0.1, // Slight curve for binned data looks better than strict steps
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: displayLabel },
      },
      y: {
        min: 0,
        max: 1,
        title: { display: true, text: "Cumulative Probability (0.0 - 1.0)" },
        ticks: {
          callback: (value) => `${(value * 100).toFixed(0)}%`, // Show as percentage
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: `CDF of ${displayLabel}: ${userNameFilter || "All Surveyors"}`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const p = (context.parsed.y * 100).toFixed(0);
            const val = context.parsed.x.toLocaleString();
            return `${p}% of records are ≤ ${val}`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: "500px", width: "100%", padding: "20px" }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
