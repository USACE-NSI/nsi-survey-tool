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
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import Tooltip from "@mui/material/Tooltip";

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
    doUpdateDashboardView({
      viewCreateNew: false,
      viewManage: true,
      viewActive: false,
      viewCompleted: false,
    });
    doUpdateSurvey(survey);
  };

  return (
    <div className="gw-p-6">
      <div className="gw-mb-4 gw-flex gw-justify-between gw-items-end">
        <div>
          <h2 className="gw-text-xl gw-font-bold gw-text-slate-800">
            Completed Surveys
          </h2>
          <p className="gw-text-sm gw-text-slate-500">
            Review results and manage archived survey data.
          </p>
        </div>
      </div>

      <div className="gw-bg-white gw-rounded-lg gw-shadow-sm gw-border gw-border-slate-200 gw-overflow-hidden">
        <Table dense overflow stickyHeader className="gw-w-full">
          <TableHead className="gw-bg-slate-50">
            <TableRow>
              <TableHeader className="gw-py-4 gw-px-4 gw-text-xs gw-font-bold gw-uppercase gw-text-slate-600">
                Survey Details
              </TableHeader>
              <TableHeader className="gw-text-xs gw-font-bold gw-uppercase gw-text-slate-600">
                Completion Date
              </TableHeader>
              <TableHeader className="gw-text-xs gw-font-bold gw-uppercase gw-text-slate-600">
                Status
              </TableHeader>
              <TableHeader className="gw-text-right gw-pr-8 gw-text-xs gw-font-bold gw-uppercase gw-text-slate-600">
                Actions
              </TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {completedSurveys.list.map((item) => (
              <TableRow
                key={item.id}
                className="hover:gw-bg-slate-50/50 gw-transition-colors"
              >
                {/* 1. Survey Name & Owner */}
                <TableCell className="gw-py-4 gw-px-4">
                  <div className="gw-flex gw-flex-col">
                    <span className="gw-font-bold gw-text-slate-800">
                      {item.name}
                    </span>
                    <span className="gw-text-xs gw-text-slate-500">
                      Lead: {item.owner}
                    </span>
                  </div>
                </TableCell>

                {/* 2. Date */}
                <TableCell>
                  <span className="gw-text-sm gw-text-slate-600">
                    {item.dueDate}
                  </span>
                </TableCell>

                {/* 3. Status Badge */}
                <TableCell>
                  <span className="gw-inline-flex gw-items-center gw-px-2.5 gw-py-0.5 gw-rounded-full gw-text-xs gw-font-medium gw-bg-green-100 gw-text-green-800">
                    Completed
                  </span>
                </TableCell>

                {/* 4. Grouped Actions */}
                <TableCell className="gw-text-right gw-pr-4">
                  <div className="gw-flex gw-justify-end gw-gap-2">
                    <Tooltip title="View Detailed Statistics">
                      <Button
                        className="gw-p-2 gw-bg-gray-600 hover:gw-bg-slate-100 gw-text-slate-600 gw-rounded-md"
                        onClick={() => doUpdateUrl("/results")}
                      >
                        <BarChartIcon fontSize="small" />
                      </Button>
                    </Tooltip>

                    <Tooltip title="Manage Archive">
                      <Button
                        disabled={user.name !== item.owner}
                        className={`gw-p-2 gw-rounded-md ${
                          user.name === item.owner
                            ? "gw-bg-gray-600 hover:gw-bg-gray-600 gw-text-white"
                            : "gw-bg-gray-600 gw-text-red"
                        }`}
                        onClick={() => openManage(item)}
                      >
                        <SettingsIcon fontSize="small" />
                      </Button>
                    </Tooltip>
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
