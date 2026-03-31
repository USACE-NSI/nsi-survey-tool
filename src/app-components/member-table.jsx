import { Button, Checkboxes } from "@usace/groundwork";
import { useConnect } from "redux-bundler-hook";

import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
  Code,
} from "@usace/groundwork";

export default function MemberTable() {
  const { survey, members, doUpdateSurvey } = useConnect(
    "selectUser",
    "selectSurvey",
    "selectMembers",
    "doUpdateSurvey",
    "doUpdateSurveyGUID"
  );

  const handleAddMember = (memberName) => {
    if (!survey.members.includes(memberName)) {
      const updatedMembers = [...survey.members, memberName];
      doUpdateSurvey({ ...survey, members: updatedMembers });
    }
  };

  const handleRemoveMember = (memberName) => {
    const updatedMembers = survey.members.filter((m) => m !== memberName);
    doUpdateSurvey({ ...survey, members: updatedMembers });
  };
  return (
    <div style={{ padding: "5px" }}>
      <div className="form-group">
        <label>Add Surveyor</label>
        <select
          className="form-control st-input"
          onChange={(e) => handleAddMember(e.target.value)}
          value=""
        >
          <option value="" disabled>
            Select a surveyor...
          </option>
          {members.list
            /* Hide members already in the survey.members array */
            .filter((m) => !survey.members.includes(m))
            .map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
        </select>
      </div>
      <div>
        <Table striped dense overflow stickyHeader>
          <TableHead>
            <TableRow>
              <TableHeader>Surveyor Name</TableHeader>
              <TableHeader></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {survey.members.map((item) => (
              <TableRow key={item}>
                <TableCell>
                  <Code>{item}</Code>
                </TableCell>
                <TableCell>
                  <div>
                    <Button
                      className="gw-flex-1 bg-secondary border-r border-white/20 px-4 py-2 first:rounded-l-md last:rounded-r-md st-btn-tb"
                      onClick={() => handleRemoveMember(item)}
                    >
                      Remove
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
