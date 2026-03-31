import { useConnect } from "redux-bundler-hook";
import { Table, TableBody, TableRow, TableCell, Code } from "@usace/groundwork";
export default function SurveyStatusTable() {
  const { activeSurveys, completedSurveys, doUpdateDashboardView } = useConnect(
    "selectActiveSurveys",
    "selectCompletedSurveys",
    "doUpdateDashboardView"
  );
  const setView = (rowName) => {
    if (rowName == "active") {
      doUpdateDashboardView({
        viewCreateNew: false,
        viewManage: false,
        viewActive: true,
        viewCompleted: false,
      });
    } else if (rowName == "completed") {
      doUpdateDashboardView({
        viewCreateNew: false,
        viewManage: false,
        viewActive: false,
        viewCompleted: true,
      });
    }
  };
  return (
    <div style={{ padding: "15px" }}>
      My Surveys
      <Table striped dense overflow stickyHeader>
        <TableBody>
          <TableRow
            onClick={() => setView("active")}
            className="cursor-pointer"
          >
            <TableCell>
              <p>Active</p>
            </TableCell>
            <TableCell>
              <Code>{activeSurveys.list.length}</Code>
            </TableCell>
          </TableRow>
          <TableRow
            onClick={() => setView("completed")}
            className="cursor-pointer"
          >
            <TableCell>
              <p>Completed</p>
            </TableCell>
            <TableCell>
              <Code>{completedSurveys.list.length}</Code>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
