import React, { useState } from "react";
import { useConnect } from "redux-bundler-hook";
import { Line } from "react-chartjs-2";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import AreaChartIcon from "@mui/icons-material/AreaChart"; // CDF Icon
import TimelineIcon from "@mui/icons-material/Timeline"; // PDF Icon
import "chart.js/auto";

// Helper for PDF: Simple Gaussian Kernel Density Estimation
const getPDFData = (values, numPoints = 100) => {
  const min = values[0];
  const max = values[values.length - 1];
  const range = max - min;
  const bandwidth = range / 25; // Simple heuristic for smoothness

  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const x = min + (i / numPoints) * range;
    let density = 0;
    values.forEach((v) => {
      const diff = (x - v) / bandwidth;
      density +=
        Math.exp(-0.5 * diff * diff) / (Math.sqrt(2 * Math.PI) * bandwidth);
    });
    points.push({ x, y: density / values.length });
  }
  return points;
};

const getCDFData = (values, numPoints = 100) => {
  return Array.from({ length: numPoints + 1 }, (_, i) => {
    const p = i / numPoints;
    const idx = Math.min(
      Math.floor(p * (values.length - 1)),
      values.length - 1
    );
    return { x: values[idx], y: p };
  });
};

export default function ViewResultsDistribution() {
  const [mode, setMode] = useState("cdf"); // State to toggle cdf/pdf
  const { survey, surveyResults } = useConnect(
    "selectSurvey",
    "selectSurveyResults"
  );

  const { results = [] } = survey;
  const { userNameFilter, fieldFilter } = surveyResults;
  const targetField = fieldFilter.field;

  const values = results
    .filter(
      (r) =>
        !userNameFilter ||
        userNameFilter === "All Surveyors" ||
        r.userName === userNameFilter
    )
    .map((d) => parseFloat(d[targetField]))
    .filter((v) => !isNaN(v) && v >= 0)
    .sort((a, b) => a - b);

  if (values.length === 0) return <div className="p-4">No data available.</div>;

  const dataPoints = mode === "cdf" ? getCDFData(values) : getPDFData(values);

  const chartData = {
    datasets: [
      {
        label: mode.toUpperCase(),
        data: dataPoints,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  };

  return (
    <div style={{ height: "550px", width: "100%", padding: "20px" }}>
      <div className="gw-flex gw-justify-between gw-items-center gw-mb-4">
        <h3 className="gw-font-bold">{fieldFilter.display} Distribution</h3>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(e, newMode) => newMode && setMode(newMode)}
          size="small"
        >
          <ToggleButton value="cdf">
            <AreaChartIcon sx={{ mr: 1 }} /> CDF
          </ToggleButton>
          <ToggleButton value="pdf">
            <TimelineIcon sx={{ mr: 1 }} /> PDF
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div style={{ height: "450px" }}>
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                title: {
                  display: true,
                  text: mode === "cdf" ? "Cumulative Probability" : "Density",
                },
              },
              x: {
                type: "linear",
                title: { display: true, text: fieldFilter.display },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
