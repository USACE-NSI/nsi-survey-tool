import { composeBundles, createCacheBundle } from "redux-bundler"
import cache from "./cache"
import routesBundle from "./routes-bundle";
import surveyElementBundle from "./survey-element-bundle";
import mapBundle from "./map-bundle";
import selectionBundle from "./selection-bundle";
import createNewSurveyBundle from "./survey-bundle";
import activeSurveysBundle from "./active-surveys-bundle";
import dashboardBundle from "./dashboard-bundle";
import completedSurveysBundle from "./completed-surveys-bundle";
import userBundle from "./user-bundle";
import membersBundle from "./members-bundle"
import surveyResultsBundle from "./survey-results-bundle";

export default composeBundles(
    createCacheBundle({ cacheFn: cache.set }),
    routesBundle,
    surveyElementBundle,
    mapBundle,
    selectionBundle,
    createNewSurveyBundle,
    activeSurveysBundle,
    dashboardBundle,
    completedSurveysBundle,
    userBundle,
    membersBundle,
    surveyResultsBundle
)