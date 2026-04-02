import {
  Button,
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
  ProgressBar,
} from "@usace/groundwork";
import { useConnect } from "redux-bundler-hook";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import MapIcon from "@mui/icons-material/Map";
import Tooltip from "@mui/material/Tooltip"; // Optional but recommended

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
      <div className="gw-mb-4">
        <h2 className="gw-text-xl gw-font-bold gw-text-slate-800">
          Active Surveys
        </h2>
        <p className="gw-text-sm gw-text-slate-500">
          Monitor progress and manage ongoing survey efforts.
        </p>
      </div>

      <div className="gw-bg-white gw-rounded-lg gw-shadow-sm gw-border gw-border-slate-200 gw-overflow-hidden">
        <Table dense overflow stickyHeader className="gw-w-full">
          <TableHead className="gw-bg-slate-50">
            <TableRow>
              <TableHeader className="gw-py-4 gw-px-4 gw-text-xs gw-font-bold gw-uppercase gw-text-slate-600">
                Survey Details
              </TableHeader>
              <TableHeader className="gw-text-xs gw-font-bold gw-uppercase gw-text-slate-600">
                Due Date
              </TableHeader>
              <TableHeader className="gw-text-xs gw-font-bold gw-uppercase gw-text-slate-600">
                Progress
              </TableHeader>
              <TableHeader className="gw-text-right gw-pr-8 gw-text-xs gw-font-bold gw-uppercase gw-text-slate-600">
                Actions
              </TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeSurveys.list.map((item) => (
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
                      Owners:{" "}
                      {item.owners?.length > 0
                        ? item.owners.join(", ")
                        : "No owners assigned"}
                    </span>
                  </div>
                </TableCell>

                {/* 2. Due Date with Status Badge logic */}
                <TableCell>
                  <span className="gw-text-sm gw-font-medium gw-text-slate-600">
                    {item.dueDate}
                  </span>
                </TableCell>

                {/* 3. Visual Progress Bar */}
                <TableCell className="gw-w-64">
                  <div className="gw-flex gw-items-center gw-gap-3">
                    <div className="gw-flex-1">
                      <ProgressBar
                        progress={(item.percentComplete || 0) * 100}
                        showProgress={true}
                      />
                    </div>
                    <span className="gw-text-xs gw-font-bold gw-text-slate-600">
                      {item.percentComplete.toLocaleString(undefined, {
                        style: "percent",
                      })}
                    </span>
                  </div>
                </TableCell>

                {/* 4. Grouped Actions */}
                <TableCell className="gw-text-right gw-pr-4">
                  <div className="gw-flex gw-justify-left gw-gap-1">
                    <Tooltip title="View Map">
                      <Button
                        className="gw-p-2 gw-bg-gray-600 hover:gw-bg-gray-600 gw-text-white gw-rounded-md"
                        onClick={() => doUpdateUrl("/survey")}
                      >
                        <MapIcon fontSize="small" />
                      </Button>
                    </Tooltip>

                    <Tooltip title="View Statistics">
                      <Button
                        className="gw-p-2 gw-bg-gray-600 hover:gw-bg-gray-600 gw-text-white gw-rounded-md"
                        onClick={() => doUpdateUrl("/results")}
                      >
                        <BarChartIcon fontSize="small" />
                      </Button>
                    </Tooltip>

                    <Tooltip title="Manage Settings">
                      <Button
                        disabled={!item.owners?.includes(user.name)}
                        className={`gw-p-2 gw-rounded-md ${
                          item.owners?.includes(user.name)
                            ? "gw-bg-gray-600 hover:gw-bg-gray-600 gw-text-white"
                            : "gw-bg-red-600 gw-text-white"
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
