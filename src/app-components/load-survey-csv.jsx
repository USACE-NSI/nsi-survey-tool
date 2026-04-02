import {
  Button,
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
} from "@usace/groundwork";
import { useConnect } from "redux-bundler-hook";
import Papa from "papaparse";

export default function LoadSurveyCSV() {
  const fwLinkHost = "https://www.hec.usace.army.mil/fwlink/?linkid=";
  const { survey, doUpdateSurvey } = useConnect(
    "selectSurvey",
    "doUpdateSurvey"
  );

  const inventories = [
    { val: "2022", display: "NSI 2022" },
    { val: "2026", display: "NSI 2026" },
    { val: "USER", display: "USER PROVIDED 1" },
  ];

  const toBool = (val) => {
    const s = String(val).toLowerCase().trim();
    return ["true", "1", "yes", "t", "y"].includes(s);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const newElements = results.data.map((row) => ({
            fd_id: row.fd_id,
            strata: row.strata,
            control: toBool(row.control),
          }));
          doUpdateSurvey({
            ...survey,
            elements: newElements,
            sampleSize: newElements.length,
          });
        },
      });
    }
  };

  return (
    <div className="gw-space-y-6">
      {/* Configuration Row */}
      <div className="gw-grid gw-grid-cols-1 md:gw-grid-cols-2 gw-gap-6">
        <div className="gw-flex gw-flex-col gw-gap-2">
          <div className="gw-flex gw-items-center gw-gap-2">
            <label className="gw-font-semibold gw-text-sm gw-text-slate-700">
              NSI Inventory
            </label>
            <a
              href={`${fwLinkHost}nsi-survey-tool-damage-categories`}
              target="_blank"
              className="gw-text-slate-400 hover:gw-text-blue-600"
            >
              <i className="mdi mdi-help-circle-outline" />
            </a>
          </div>
          <select
            className="gw-border gw-border-slate-300 gw-rounded-md gw-p-2 gw-bg-white focus:gw-ring-2 focus:gw-ring-blue-500 gw-outline-none gw-text-sm"
            value={survey.inventorySource || "2022"}
            onChange={(e) =>
              doUpdateSurvey({ ...survey, inventorySource: e.target.value })
            }
          >
            {inventories.map((cat) => (
              <option key={cat.val} value={cat.val}>
                {cat.display}
              </option>
            ))}
          </select>
        </div>

        {/* Status Highlight */}
        <div className="gw-bg-blue-50 gw-border gw-border-blue-100 gw-rounded-md gw-p-4 gw-flex gw-flex-col gw-justify-center">
          <span className="gw-text-xs gw-font-bold gw-uppercase gw-text-slate-400 gw-tracking-wider">
            Calculated Survey Sample Size
          </span>
          <span className="gw-text-3xl gw-font-black gw-text-slate-400">
            {survey.sampleSize || 0}
          </span>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="gw-space-y-2">
        <label className="gw-font-semibold gw-text-sm gw-text-slate-700">
          Import Survey Definitions
        </label>
        <div className="gw-relative gw-group">
          <div className="gw-border-2 gw-border-dashed gw-border-slate-300 gw-rounded-lg gw-p-8 gw-text-center hover:gw-border-blue-400 hover:gw-bg-blue-50 gw-transition-all">
            <i className="mdi mdi-file-upload-outline gw-text-3xl gw-text-slate-400 gw-mb-2" />
            <p className="gw-text-sm gw-text-slate-600">
              Drag and drop your <b>.csv</b> here or{" "}
              <span className="gw-text-blue-600 gw-font-semibold">
                browse files
              </span>
            </p>
            <p className="gw-text-xs gw-text-slate-400 gw-mt-1">
              Required columns: fd_id, strata, control
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

      {/* Preview Section */}
      {survey.elements && survey.elements.length > 0 && (
        <div className="gw-border gw-border-slate-200 gw-rounded-lg gw-overflow-hidden gw-mt-4">
          <div className="gw-bg-slate-50 gw-px-4 gw-py-2 gw-border-b gw-border-slate-200 gw-flex gw-justify-between gw-items-center">
            <span className="gw-text-xs gw-font-bold gw-text-slate-500 gw-uppercase">
              Data Preview (First 5 records)
            </span>
            <span className="gw-text-xs gw-text-blue-600 gw-font-medium">
              File successfully parsed
            </span>
          </div>
          <Table dense striped className="gw-w-full">
            <TableHead>
              <TableRow className="gw-bg-white">
                <TableHeader className="gw-text-xs gw-font-bold gw-text-slate-600">
                  FD_ID
                </TableHeader>
                <TableHeader className="gw-text-xs gw-font-bold gw-text-slate-600">
                  STRATA
                </TableHeader>
                <TableHeader className="gw-text-xs gw-font-bold gw-text-slate-600">
                  CONTROL
                </TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {survey.elements.slice(0, 5).map((item, index) => (
                <TableRow key={index} className="gw-bg-white">
                  <TableCell className="gw-font-mono gw-text-xs">
                    {item.fd_id}
                  </TableCell>
                  <TableCell className="gw-text-xs">{item.strata}</TableCell>
                  <TableCell className="gw-text-xs">
                    <span
                      className={`gw-px-2 gw-py-0.5 gw-rounded-full gw-text-[10px] gw-font-bold gw-bg-slate-100 gw-text-slate-600`}
                    >
                      {item.control ? "TRUE" : "FALSE"}
                    </span>
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
