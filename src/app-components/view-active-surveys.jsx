import { Button } from "@usace/groundwork";
import { useConnect } from "redux-bundler-hook";
import SettingsIcon from "@mui/icons-material/Settings";
import MapIcon from "@mui/icons-material/Map";
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
  Code,
} from "@usace/groundwork";
export default function ViewActiveSurveys() {
  const {
    activeSurveys,
    user,
    doUpdateUrl,
    doUpdateDashboardView,
    doUpdateSurvey,
  } = useConnect(
    "selectActiveSurveys",
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
            <TableHeader>Percent Complete</TableHeader>
            <TableHeader></TableHeader>
            <TableHeader></TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {activeSurveys.list.map((item) => (
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
                <Code>
                  {(item.percentComplete / 1).toLocaleString(undefined, {
                    style: "percent",
                  })}
                </Code>
              </TableCell>
              <TableCell>
                <div>
                  <Button
                    className="gw-flex-1 bg-secondary border-r border-white/20 px-4 py-2 first:rounded-l-md last:rounded-r-md st-btn-tb2"
                    onClick={() => doUpdateUrl("/survey")}
                  >
                    View Survey <MapIcon />
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
