import { createRouteBundle } from "redux-bundler";
import Home from "../app-pages/home";
import Survey from "../app-pages/survey";
import UserDashboard from "../app-pages/user-dashboard";
import SurveyResultsAnalysis from "../app-pages/survey-results-analysis";

export default createRouteBundle({
  "/": Home,
  "/survey": Survey,
  "/dashboard":UserDashboard,
  "/results": SurveyResultsAnalysis,
  "*": Home,
});