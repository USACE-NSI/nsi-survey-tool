import { useState, useEffect } from "react";
import { useConnect } from "redux-bundler-hook";
import {
  Button,
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
} from "@usace/groundwork";
import HelpLink from "./help-link";
import UploadPolygon from "./upload-polygon";

// Human-readable labels for the strata enum names persisted to
// survey_element.strata (see strataLabel() in nsi-bundle). The enum is the key
// used for survey.strataProportions / strataSampleSizes; this map is display
// only. Falls back to the raw enum for any value not listed.
const STRATA_DISPLAY_LABELS = {
  RES1_OTHER: "Residential, no flood zone",
  RES1_FLD: "Residential, flood zone",
  OTHER_FLD: "Flood zone, non-residential",
  OTHER_OTHER: "Other",
  RES1: "Residential",
  FLD: "Flood zone",
  OTHER: "Other",
  ALL: "All structures",
};
const strataDisplayLabel = (enumName) =>
  STRATA_DISPLAY_LABELS[enumName] ?? enumName;

export default function GenerateStratifiedSurvey() {
  //const fwLinkHost = "https://www.hec.usace.army.mil/fwlink/?linkid=";
  const {
    survey,
    doUpdateSurvey,
    doGenerateNsiStratifiedSurvey,
    doCancelNsiStratifiedSurvey,
    nsiFetching,
    nsiError,
    nsiProcessed,
    nsiStartedAt,
  } = useConnect(
    "selectSurvey",
    "doUpdateSurvey",
    "doGenerateNsiStratifiedSurvey",
    "doCancelNsiStratifiedSurvey",
    "selectNsiFetching",
    "selectNsiError",
    "selectNsiProcessed",
    "selectNsiStartedAt",
  );

  // Tick a local clock once a second while a stream is running so the elapsed
  // time stays current; the stream itself only dispatches a structure count.
  // Elapsed is derived during render from this clock and the run's start time.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!nsiFetching || !nsiStartedAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [nsiFetching, nsiStartedAt]);
  const elapsed =
    nsiFetching && nsiStartedAt
      ? Math.max(0, Math.floor((now - nsiStartedAt) / 1000))
      : 0;

  const formatElapsed = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  // Options arrays remain the same...
  const inventories = [
    { val: "2022", display: "NSI 2022" },
    { val: "2026", display: "NSI 2026" },
    { val: "USER", display: "USER PROVIDED 1" },
  ];
  const confidence = [
    { val: 0.95, display: "95%" },
    { val: 0.9, display: "90%" },
    { val: 0.8, display: "80%" },
  ];
  const margin = [
    { val: 0.05, display: "5%" },
    { val: 0.02, display: "2%" },
    { val: 0.01, display: "1%" },
  ];
  const proportion = [
    { val: 0.5, display: "50%" },
    { val: 0.25, display: "25%" },
    { val: 0.9, display: "90%" },
  ];
  const percentControl = [
    { val: 0.01, display: "1%" },
    { val: 0.02, display: "2%" },
    { val: 0.05, display: "5%" },
    { val: 0.1, display: "10%" },
  ];

  const handleChange = (field) => (e) => {
    doUpdateSurvey({ ...survey, [field]: e.target.value });
  };

  // <select> emits string values even when option.value is numeric; the server
  // binds these into float64 fields (StratificationInfo.{margin,proportion,confidence,pct_control})
  // and rejects the request with a 400 if they arrive as strings.
  const handleNumberChange = (field) => (e) => {
    doUpdateSurvey({ ...survey, [field]: Number(e.target.value) });
  };

  const handleChecked = (field) => (e) => {
    doUpdateSurvey({ ...survey, [field]: e.target.checked });
  };

  // Per-stratum proportion override. Stored as a label->proportion map on
  // survey.strataProportions; strata without an entry fall back to
  // survey.defaultProportion in createStratifiedReservoir.
  const handleStrataProportionChange = (label) => (e) => {
    doUpdateSurvey({
      ...survey,
      strataProportions: {
        ...(survey.strataProportions || {}),
        [label]: Number(e.target.value),
      },
    });
  };

  // Strata rows depend on which stratification checkboxes are selected. Only
  // shown when at least one is active (otherwise the survey-wide proportion
  // applies).
  const useResidential = survey.residentialStratification;
  const useFloodzone = survey.floodzoneStratification;
  // Strata enum names — must match strataLabel() in nsi-bundle so the
  // proportion-table keys line up with what the sampler writes to
  // survey.strataProportions (and persists to survey_element.strata).
  let strata = [];
  if (useResidential && useFloodzone) {
    strata = ["RES1_OTHER", "RES1_FLD", "OTHER_FLD", "OTHER_OTHER"];
  } else if (useResidential) {
    strata = ["RES1", "OTHER"];
  } else if (useFloodzone) {
    strata = ["FLD", "OTHER"];
  }
  const isStratified = strata.length > 0;

  return (
    <div className="gw-space-y-6">
      {/* 1. Inventory & Polygon Section */}
      <div className="gw-grid gw-grid-cols-1 md:gw-grid-cols-2 gw-gap-6">
        <div className="gw-flex gw-flex-col gw-gap-2">
          <label className="gw-font-semibold gw-text-sm gw-text-slate-700">
            NSI Inventory <HelpLink id="nsi-inventory" />
          </label>
          <select
            className="gw-border gw-border-slate-300 gw-rounded-md gw-p-2 gw-bg-white gw-text-sm"
            value={survey.inventorySource}
            onChange={handleChange("inventorySource")}
          >
            {inventories.map((cat) => (
              <option key={cat.val} value={cat.val}>
                {cat.display}
              </option>
            ))}
          </select>
        </div>

        <UploadPolygon />
      </div>

      {/* 2. Stratification Settings */}
      <div className="gw-bg-slate-50 gw-p-4 gw-rounded-lg gw-border gw-border-slate-200 gw-space-y-3">
        <span className="gw-text-xs gw-font-bold gw-text-slate-500 gw-uppercase gw-tracking-wider">
          Catagorical Stratification
        </span>

        <label className="gw-flex gw-items-center gw-gap-3 gw-cursor-pointer">
          <input
            type="checkbox"
            className="gw-w-4 gw-h-4"
            checked={survey.residentialStratification}
            onChange={handleChecked("residentialStratification")}
          />
          <span className="gw-text-sm gw-text-slate-700">
            Split by Residential (RES1) vs. Others
          </span>
        </label>

        <label className="gw-flex gw-items-center gw-gap-3 gw-cursor-pointer">
          <input
            type="checkbox"
            className="gw-w-4 gw-h-4"
            checked={survey.floodzoneStratification}
            onChange={handleChecked("floodzoneStratification")}
          />
          <span className="gw-text-sm gw-text-slate-700">
            Split by Floodzones (A, V) vs. Others
          </span>
        </label>
      </div>

      {/* 3. Statistical Parameters Grid */}
      <div className="gw-grid gw-grid-cols-1 md:gw-grid-cols-3 gw-gap-4 gw-items-end">
        <div className="gw-flex gw-flex-col gw-gap-2">
          <label className="gw-font-semibold gw-text-xs gw-text-slate-500 gw-uppercase">
            Confidence{" "}
            <HelpLink
              id="confidence"
              title="Confidence level — the probability that the true population value falls within the chosen margin of error. Higher confidence (e.g. 95%) demands a larger sample to achieve the same margin, increasing the generated survey size."
            />
          </label>
          <select
            className="gw-border gw-border-slate-300 gw-rounded-md gw-p-2 gw-bg-white gw-text-sm"
            value={survey.confidence}
            onChange={handleNumberChange("confidence")}
          >
            {confidence.map((e) => (
              <option key={e.val} value={e.val}>
                {e.display}
              </option>
            ))}
          </select>
        </div>

        <div className="gw-flex gw-flex-col gw-gap-2">
          <label className="gw-font-semibold gw-text-xs gw-text-slate-500 gw-uppercase">
            Margin{" "}
            <HelpLink
              id="margin"
              title="Margin of error — the maximum acceptable difference between the sample estimate and the true population value. A tighter margin (e.g. 1%) requires a substantially larger sample, increasing the generated survey size; a looser margin (e.g. 5%) reduces it."
            />
          </label>
          <select
            className="gw-border gw-border-slate-300 gw-rounded-md gw-p-2 gw-bg-white gw-text-sm"
            value={survey.margin}
            onChange={handleNumberChange("margin")}
          >
            {margin.map((e) => (
              <option key={e.val} value={e.val}>
                {e.display}
              </option>
            ))}
          </select>
        </div>

        <div className="gw-flex gw-flex-col gw-gap-2">
          <label className="gw-font-semibold gw-text-xs gw-text-slate-500 gw-uppercase">
            % Control{" "}
            <HelpLink
              id="pct-control"
              title="Percent control structures — the share of sampled structures flagged as control (verification) points. Raising this value sets aside a larger portion of the sample for control, used to validate the survey rather than contribute to the primary estimate."
            />
          </label>
          <select
            className="gw-border gw-border-slate-300 gw-rounded-md gw-p-2 gw-bg-white gw-text-sm"
            value={survey.percentControlStructures}
            onChange={handleNumberChange("percentControlStructures")}
          >
            {percentControl.map((e) => (
              <option key={e.val} value={e.val}>
                {e.display}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3b. Per-Strata Proportion Table */}
      {isStratified && (
        <div className="gw-border gw-border-slate-200 gw-rounded-lg gw-overflow-hidden">
          <div className="gw-bg-slate-50 gw-px-4 gw-py-2 gw-border-b gw-border-slate-200 gw-flex gw-items-center gw-gap-1">
            <span className="gw-text-xs gw-font-bold gw-text-slate-500 gw-uppercase">
              Per-Strata Proportion
            </span>
            <HelpLink
              id="prop"
              placement="bottom"
              title="Per-strata proportion — the fraction of each stratum's structures to include in the sample. A higher proportion draws more structures from that stratum, letting you oversample groups of interest; strata left unset fall back to the default proportion."
            />
          </div>
          <Table dense striped className="gw-w-full">
            <TableHead>
              <TableRow>
                <TableHeader>Strata</TableHeader>
                <TableHeader>Proportion</TableHeader>
                <TableHeader>Sample Size</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {strata.map((label) => (
                <TableRow key={label}>
                  <TableCell className="gw-text-xs" title={label}>
                    {strataDisplayLabel(label)}
                  </TableCell>
                  <TableCell>
                    <select
                      className="gw-w-full gw-border gw-border-slate-300 gw-rounded-md gw-p-1 gw-bg-white gw-text-sm"
                      value={
                        survey.strataProportions?.[label] ??
                        survey.defaultProportion
                      }
                      onChange={handleStrataProportionChange(label)}
                    >
                      {proportion.map((e) => (
                        <option key={e.val} value={e.val}>
                          {e.display}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  {/* Per-stratum sample size from the survey bundle; 0 until the
                      Generate button populates survey.strataSampleSizes. */}
                  <TableCell className="gw-text-xs gw-font-mono">
                    {survey.strataSampleSizes?.[label] ?? 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sample size display */}
      <div className="gw-bg-blue-50 gw-border gw-border-blue-100 gw-rounded-md gw-p-2 gw-text-center gw-w-fit">
        <span className="gw-block gw-text-[10px] gw-font-bold gw-text-blue-600 gw-uppercase">
          Sample Size
        </span>
        <span className="gw-text-xl gw-font-black gw-text-blue-900">
          {survey.sampleSize || 0}
        </span>
      </div>

      {/* Generate button — fetches NSI inside the perimeter and writes a stratified sample to survey.elements. */}
      <div className="gw-flex gw-items-center gw-gap-3">
        <Button
          onClick={() => doGenerateNsiStratifiedSurvey()}
          disabled={!survey.perimeterGeometry || nsiFetching}
        >
          {nsiFetching ? "Generating..." : "Generate Stratified Survey"}
        </Button>
        {nsiFetching && (
          <>
            <Button
              className="btn btn-secondary"
              onClick={() => doCancelNsiStratifiedSurvey()}
            >
              Cancel
            </Button>
            <span className="gw-text-xs gw-text-slate-600">
              Scanned {(nsiProcessed || 0).toLocaleString()} structures…{" "}
              ({formatElapsed(elapsed)})
            </span>
          </>
        )}
        {!survey.perimeterGeometry && !nsiFetching && (
          <span className="gw-text-xs gw-text-slate-500">
            Upload a perimeter polygon to enable.
          </span>
        )}
        {nsiError && !nsiFetching && (
          <span className="gw-text-xs gw-text-red-600">{nsiError}</span>
        )}
      </div>

      {/* 4. Preview Table (Consistent with LoadSurveyCSV) */}
      {survey.elements && survey.elements.length > 0 && (
        <div className="gw-border gw-border-slate-200 gw-rounded-lg gw-overflow-hidden">
          <div className="gw-bg-slate-50 gw-px-4 gw-py-2 gw-border-b gw-border-slate-200">
            <span className="gw-text-xs gw-font-bold gw-text-slate-500 gw-uppercase">
              Generated Preview
            </span>
          </div>
          <Table dense striped className="gw-w-full">
            <TableHead>
              <TableRow>
                <TableHeader>fd_id</TableHeader>
                <TableHeader>strata</TableHeader>
                <TableHeader>control</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {survey.elements.slice(0, 5).map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="gw-font-mono gw-text-xs">
                    {item.fd_id}
                  </TableCell>
                  <TableCell className="gw-text-xs">{item.strata}</TableCell>
                  <TableCell className="gw-text-xs">
                    {item.control ? "TRUE" : "FALSE"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
