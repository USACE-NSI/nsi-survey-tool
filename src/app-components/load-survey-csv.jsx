import { Button } from "@usace/groundwork";
import { useConnect } from "redux-bundler-hook";
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
  Code,
  Field,
  Input,
  Label,
} from "@usace/groundwork";
import Papa from "papaparse";
export default function LoadSurveyCSV() {
  const toBool = (val) => {
    if (typeof val === "boolean") return val;
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
          const newElements = [
            ...survey.elements,
            ...results.data.map((row) => ({
              fd_id: row.fd_id,
              strata: row.strata,
              control: toBool(row.control),
            })),
          ];

          const updatedSurvey = {
            ...survey,
            elements: newElements,
            surveySize: newElements.length, // Calculate total size
          };
          doUpdateSurvey(updatedSurvey);
        },
      });
    }
  };
  const fwLinkHost = " https://www.hec.usace.army.mil/fwlink/?linkid=";
  const { survey, doUpdateSurvey } = useConnect(
    "selectSurvey",
    "doUpdateSurvey"
  );
  const inventories = [
    //this list will ultimately come from the nsi api
    { val: "2022", display: "NSI 2022" },
    { val: "2026", display: "NSI 2026" },
    { val: "USER", display: "USER PROVIDED 1" },
  ];
  const handleChange = (field) => (e) => {
    let val = e.target.value;
    console.log(field + " " + val);
    const s = { ...survey, [field]: val };
    doUpdateSurvey(s);
  };
  return (
    <div>
      <div className="form-group">
        <div style={{ display: "flex" }}>
          <label style={{ flexGrow: 1 }}>NSI Inventory</label>
          <a
            target="_blank"
            title="Help for Inventory Source"
            href={`${fwLinkHost}nsi-survey-tool-damage-categories`}
          >
            <i className="mdi mdi-help-circle-outline" />
          </a>
        </div>
        <select
          className="form-control st-input"
          id="damcat"
          onChange={handleChange("inventorySource")}
        >
          {inventories.map((cat) =>
            cat.val === survey.inventorySource ? (
              <option value={cat.val} selected>
                {cat.display}
              </option>
            ) : (
              <option value={cat.val}>{cat.display}</option>
            )
          )}
        </select>
      </div>
      <div>Select the CSV you want to use to define survey id's.</div>
      <div className="w-[50%]">
        <div className="mb-3">
          <Field>
            <Label>Choose a .csv file containing survey elements</Label>
            <Input type="file" accept=".csv" onChange={handleFileUpload} />
          </Field>
        </div>
      </div>
      <div className="form-group">
        <div style={{ display: "flex" }}>
          <label style={{ flexGrow: 1 }}>Survey Size</label>
        </div>
        <input
          type="text"
          readOnly // Keep readOnly if it's strictly derived from the CSV
          value={survey.surveySize || 0}
          className="form-control st-input"
          id="surveySize"
          disabled // Visual cue that it's an auto-calculated field
        />
      </div>
      {survey.elements && survey.elements.length > 0 && (
        <div>
          <div>First 5 records in uploaded file for review.</div>
          <Table striped dense overflow stickyHeader>
            <TableHead>
              <TableRow>
                <TableHeader>fd_id</TableHeader>
                <TableHeader>strata</TableHeader>
                <TableHeader>control</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {survey.elements.slice(0, 5).map((item, index) => (
                <TableRow key={item.fd_id || index}>
                  <TableCell>
                    <Code>{item.fd_id}</Code>
                  </TableCell>
                  <TableCell>
                    <Code>{item.strata}</Code>
                  </TableCell>
                  <TableCell>
                    <Code>{item.control ? "True" : "False"}</Code>
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
