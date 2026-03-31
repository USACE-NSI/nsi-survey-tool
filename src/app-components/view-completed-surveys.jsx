import { Button } from "@usace/groundwork";
import { useConnect } from "redux-bundler-hook";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
  Code,
} from "@usace/groundwork";
export default function ViewCompletedSurveys() {
  const {
    completedSurveys,
    user,
    doUpdateUrl,
    doUpdateDashboardView,
    doUpdateSurvey,
  } = useConnect(
    "selectCompletedSurveys",
    "selectUser",
    "doUpdateUrl",
    "doUpdateDashboardView",
    "doUpdateSurvey"
  );
  const openManage = (survey) => {
    console.log("opening manage surveys");
    doUpdateDashboardView({
      viewCreateNew: false,
      viewManage: true,
      viewActive: false,
      viewCompleted: false,
    });
    doUpdateSurvey(survey);
    //doUpdateUrl('/create-new-survey')
  };
  return (
    <div>
      <Table striped dense overflow stickyHeader>
        <TableHead>
          <TableRow>
            <TableHeader>Survey Name</TableHeader>
            <TableHeader>Due Date</TableHeader>
            <TableHeader>Owner</TableHeader>
            <TableHeader></TableHeader>
            <TableHeader></TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {completedSurveys.list.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Code>{item.name}</Code>
              </TableCell>
              <TableCell>
                <Code>{item.dueDate}</Code>
              </TableCell>
              <TableCell>
                <Code>{item.owner}</Code>
              </TableCell>
              <TableCell>
                <div>
                  <Button
                    className="gw-flex-1 bg-secondary border-r border-white/20 px-4 py-2 first:rounded-l-md last:rounded-r-md st-btn-tb2"
                    onClick={() => doUpdateUrl("/results")}
                  >
                    View Survey Statistics <BarChartIcon />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <Button
                    disabled={user.name !== item.owner}
                    className="gw-flex-1 bg-secondary border-r border-white/20 px-4 py-2 first:rounded-l-md last:rounded-r-md st-btn-tb2"
                    onClick={() => openManage(item)}
                  >
                    Manage Survey <SettingsIcon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
