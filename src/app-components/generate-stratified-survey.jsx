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

export default function GenerateStratifiedSurvey() {
  //const fwLinkHost = "https://www.hec.usace.army.mil/fwlink/?linkid=";
  const { survey, doUpdateSurvey } = useConnect(
    "selectSurvey",
    "doUpdateSurvey"
  );

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
    { val: 0.75, display: "75%" },
  ];

  const handleChange = (field) => (e) => {
    doUpdateSurvey({ ...survey, [field]: e.target.value });
  };

  const handleChecked = (field) => (e) => {
    doUpdateSurvey({ ...survey, [field]: e.target.checked });
  };
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      return; //implement logic here to store the polygon, to open it, to validate column names check file extension, and trigger an api call to generate the survey elements etc.
    }
  };
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

        {/* Upload Zone */}
        <div className="gw-space-y-2">
          <label className="gw-font-semibold gw-text-sm gw-text-slate-700">
            Import Spatial Stratification by Polygon
          </label>
          <div className="gw-relative gw-group">
            <div className="gw-border-2 gw-border-dashed gw-border-slate-300 gw-rounded-lg gw-p-8 gw-text-center hover:gw-border-blue-400 hover:gw-bg-blue-50 gw-transition-all">
              <i className="mdi mdi-file-upload-outline gw-text-3xl gw-text-slate-400 gw-mb-2" />
              <p className="gw-text-sm gw-text-slate-600">
                Drag and drop your <b>.shpzip</b> here or{" "}
                <span className="gw-text-blue-600 gw-font-semibold">
                  browse files
                </span>
              </p>
              <p className="gw-text-xs gw-text-slate-400 gw-mt-1">
                Required columns: id, strata, for multiple strata include
                multiple features in the polygon shape zip (win zip)
              </p>
              <input
                type="file"
                accept=".csv"
                className="gw-absolute gw-inset-0 gw-opacity-0 gw-cursor-pointer"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>
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
      <div className="gw-grid gw-grid-cols-1 md:gw-grid-cols-4 gw-gap-4 gw-items-end">
        <div className="gw-flex gw-flex-col gw-gap-2">
          <label className="gw-font-semibold gw-text-xs gw-text-slate-500 gw-uppercase">
            Confidence <HelpLink id="confidence" title="Help for confidence" />
          </label>
          <select
            className="gw-border gw-border-slate-300 gw-rounded-md gw-p-2 gw-bg-white gw-text-sm"
            value={survey.confidence}
            onChange={handleChange("confidence")}
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
            Margin <HelpLink id="margin" />
          </label>
          <select
            className="gw-border gw-border-slate-300 gw-rounded-md gw-p-2 gw-bg-white gw-text-sm"
            value={survey.margin}
            onChange={handleChange("margin")}
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
            Proportion <HelpLink id="prop" />
          </label>
          <select
            className="gw-border gw-border-slate-300 gw-rounded-md gw-p-2 gw-bg-white gw-text-sm"
            value={survey.proportion}
            onChange={handleChange("proportion")}
          >
            {proportion.map((e) => (
              <option key={e.val} value={e.val}>
                {e.display}
              </option>
            ))}
          </select>
        </div>

        <div className="gw-bg-blue-50 gw-border gw-border-blue-100 gw-rounded-md gw-p-2 gw-text-center">
          <span className="gw-block gw-text-[10px] gw-font-bold gw-text-blue-600 gw-uppercase">
            Sample Size
          </span>
          <span className="gw-text-xl gw-font-black gw-text-blue-900">
            {survey.sampleSize || 0}
          </span>
        </div>
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
