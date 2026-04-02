/*import {
  Button,
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
} from "@usace/groundwork";
import { useConnect } from "redux-bundler-hook";

export default function MemberTable() {
  const { survey, members, doUpdateSurvey } = useConnect(
    "selectSurvey",
    "selectMembers",
    "doUpdateSurvey"
  );

  const handleAddMember = (memberName) => {
    if (memberName && !survey.members.includes(memberName)) {
      const updatedMembers = [...(survey.members || []), memberName];
      doUpdateSurvey({ ...survey, members: updatedMembers });
    }
  };

  const handleRemoveMember = (memberName) => {
    const updatedMembers = survey.members.filter((m) => m !== memberName);
    doUpdateSurvey({ ...survey, members: updatedMembers });
  };

  return (
    <div className="gw-space-y-4">
      {/* Selector Section */ /*}
      <div className="gw-flex gw-flex-col gw-gap-2">
        <label className="gw-font-semibold gw-text-sm gw-text-slate-700">
          Add Surveyor
        </label>
        <div className="gw-flex gw-gap-2">
          <select
            className="gw-flex-1 gw-border gw-border-slate-300 gw-rounded-md gw-p-2 gw-bg-white focus:gw-ring-2 focus:gw-ring-blue-500 gw-outline-none gw-text-sm"
            onChange={(e) => {
              handleAddMember(e.target.value);
              e.target.value = ""; // Reset after selection
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Select a surveyor from the roster...
            </option>
            {members.list
              .filter((m) => !(survey.members || []).includes(m))
              .map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Table Section */ /*}
      <div className="gw-border gw-border-slate-200 gw-rounded-lg gw-overflow-hidden">
        <Table dense overflow stickyHeader className="gw-w-full">
          <TableHead className="gw-bg-slate-100">
            <TableRow>
              <TableHeader className="gw-text-left gw-py-3 gw-px-4 gw-text-xs gw-font-bold gw-uppercase gw-tracking-wider gw-text-slate-600">
                Surveyor Name
              </TableHeader>
              <TableHeader className="gw-text-right gw-py-3 gw-px-4"></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {survey.members && survey.members.length > 0 ? (
              survey.members.map((item) => (
                <TableRow
                  key={item}
                  className="hover:gw-bg-gray-600 gw-transition-colors"
                >
                  <TableCell className="gw-py-3 gw-px-4 gw-text-sm gw-text-slate-700">
                    {item}
                  </TableCell>
                  <TableCell className="gw-py-3 gw-px-4 gw-text-right">
                    <Button
                      className="gw-bg-gray-600 gw-text-white gw-rounded-md hover:gw-bg-red-600 gw-text-white gw-text-xs gw-font-bold gw-uppercase"
                      onClick={() => handleRemoveMember(item)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="gw-py-8 gw-text-center gw-text-slate-400 gw-italic gw-text-sm"
                >
                  No surveyors assigned to this project yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
*/
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

export default function MemberTable() {
  const { survey, members, doUpdateSurvey } = useConnect(
    "selectSurvey",
    "selectMembers",
    "doUpdateSurvey"
  );

  const handleAddMember = (memberName) => {
    if (memberName && !survey.members?.includes(memberName)) {
      const updatedMembers = [...(survey.members || []), memberName];
      doUpdateSurvey({ ...survey, members: updatedMembers });
    }
  };

  const handleRemoveMember = (memberName) => {
    const updatedMembers = survey.members.filter((m) => m !== memberName);
    // Also remove them from owners if they are deleted from the member list
    const updatedOwners = (survey.owners || []).filter((o) => o !== memberName);

    doUpdateSurvey({
      ...survey,
      members: updatedMembers,
      owners: updatedOwners,
    });
  };

  // Logic to add/remove multiple owners
  const handleToggleOwner = (memberName) => {
    const currentOwners = survey.owners || [];
    const updatedOwners = currentOwners.includes(memberName)
      ? currentOwners.filter((o) => o !== memberName)
      : [...currentOwners, memberName];

    doUpdateSurvey({ ...survey, owners: updatedOwners });
  };

  return (
    <div className="gw-space-y-4">
      {/* Selector Section */}
      <div className="gw-flex gw-flex-col gw-gap-2">
        <label className="gw-font-semibold gw-text-sm gw-text-slate-700">
          Add Surveyor
        </label>
        <div className="gw-flex gw-gap-2">
          <select
            className="gw-flex-1 gw-border gw-border-slate-300 gw-rounded-md gw-p-2 gw-bg-white focus:gw-ring-2 focus:gw-ring-blue-500 gw-outline-none gw-text-sm"
            onChange={(e) => {
              handleAddMember(e.target.value);
              e.target.value = "";
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Select a surveyor from the roster...
            </option>
            {members.list
              .filter((m) => !(survey.members || []).includes(m))
              .map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="gw-border gw-border-slate-200 gw-rounded-lg gw-overflow-hidden">
        <Table dense overflow stickyHeader className="gw-w-full">
          <TableHead className="gw-bg-slate-100">
            <TableRow>
              <TableHeader className="gw-text-left gw-py-3 gw-px-4 gw-text-xs gw-font-bold gw-uppercase gw-tracking-wider gw-text-slate-600">
                Surveyor Name
              </TableHeader>
              <TableHeader className="gw-text-center gw-py-3 gw-px-4 gw-text-xs gw-font-bold gw-uppercase gw-tracking-wider gw-text-slate-600">
                Project Owner
              </TableHeader>
              <TableHeader className="gw-text-right gw-py-3 gw-px-4"></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {survey.members && survey.members.length > 0 ? (
              survey.members.map((item) => (
                <TableRow
                  key={item}
                  className="hover:gw-bg-slate-50 gw-transition-colors"
                >
                  <TableCell className="gw-py-3 gw-px-4 gw-text-sm gw-text-slate-700">
                    {item}
                  </TableCell>
                  <TableCell className="gw-py-3 gw-px-4 gw-text-center">
                    <input
                      type="checkbox"
                      className="gw-w-4 gw-h-4 gw-cursor-pointer"
                      checked={(survey.owners || []).includes(item)}
                      onChange={() => handleToggleOwner(item)}
                    />
                  </TableCell>
                  <TableCell className="gw-py-3 gw-px-4 gw-text-right">
                    <Button
                      className="gw-bg-gray-600 gw-text-white gw-rounded-md hover:gw-bg-red-600 gw-text-xs gw-font-bold gw-uppercase"
                      onClick={() => handleRemoveMember(item)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="gw-py-8 gw-text-center gw-text-slate-400 gw-italic gw-text-sm"
                >
                  No surveyors assigned to this project yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
