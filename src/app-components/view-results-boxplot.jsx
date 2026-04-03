import React from "react";
import { useConnect } from "redux-bundler-hook";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import {
  BoxPlotController,
  BoxAndWiskers,
} from "@sgratzl/chartjs-chart-boxplot";
import { Chart } from "react-chartjs-2";

// Register the specialized boxplot components
ChartJS.register(
  BoxPlotController,
  BoxAndWiskers,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

/**
 * Calculates the 5-number summary: Min, Q1, Median, Q3, Max
 * Ignores values < 0 and non-numeric data.
 */
const calculateBoxPlotStats = (data, field) => {
  // 1. Filter out negatives, nulls, and non-numbers
  const values = data
    .map((d) => parseFloat(d[field]))
    .filter((val) => !isNaN(val) && val >= 0) // <--- Changed: only allow 0 and above
    .sort((a, b) => a - b);

  if (values.length === 0) return null;

  const getMedian = (arr) => {
    if (arr.length === 0) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };

  const min = values[0];
  const max = values[values.length - 1];
  const median = getMedian(values);

  // 2. Split data for quartiles (Standard Tukey Method)
  const lowerHalf = values.slice(0, Math.floor(values.length / 2));
  const upperHalf = values.slice(Math.ceil(values.length / 2));

  const q1 = getMedian(lowerHalf);
  const q3 = getMedian(upperHalf);

  return { min, q1, median, q3, max, count: values.length };
};
export default function ViewResultsBoxPlot() {
  console.log("boxplot");
  // 1. Pull state from store exactly like ViewResultsBar
  const { survey, surveyResults } = useConnect(
    "selectSurvey",
    "selectSurveyResults"
  );

  const { results = [] } = survey;
  const { userNameFilter, fieldFilter } = surveyResults;
  const targetField = fieldFilter.field;
  const displayLabel = fieldFilter.display;

  // 2. Filter data based on selected surveyor
  const filteredResults =
    userNameFilter && userNameFilter !== "All Surveyors"
      ? results.filter((r) => r.userName === userNameFilter)
      : results;

  // 3. Generate the summary statistics
  const stats = calculateBoxPlotStats(filteredResults, targetField);
  console.log(stats);
  if (!stats) {
    return (
      <div className="p-4">
        No numerical data available for {displayLabel}. Use continuous variables
        X, Y, Foundation Height, Number of Stories, Square Footage
      </div>
    );
  }

  const chartData = {
    labels: [displayLabel],
    datasets: [
      {
        label: "5-Number Summary",
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgb(54, 162, 235)",
        borderWidth: 1,
        outlierColor: "red",
        outlierBackgroundColor: "red", // Fills the shape with red
        outlierBorderColor: "red",
        outlierRadius: 6,
        outlierStyle: "crossRot",
        padding: 10,
        itemRadius: 2,
        data: [
          {
            min: stats.min,
            q1: stats.q1,
            median: stats.median,
            q3: stats.q3,
            max: stats.max,
            outliers: [stats.max],
          },
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `${displayLabel} Distribution: ${
          userNameFilter || "All Surveyors"
        }`,
      },
      tooltip: {
        callbacks: {
          // Enhances tooltip to show the specific 5-number values
          label: (context) => {
            const v = context.raw;
            return [
              `Max: ${v.max}`,
              `Q3: ${v.q3}`,
              `Median: ${v.median}`,
              `Q1: ${v.q1}`,
              `Min: ${v.min}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: "Value" },
      },
    },
  };

  return (
    <div style={{ height: "500px", width: "100%", padding: "20px" }}>
      <Chart type="boxplot" data={chartData} options={options} />
    </div>
  );
}
