import { useConnect } from "redux-bundler-hook";
import { useEffect, useState } from "react";
import { getNavHelper } from "internal-nav-helper";
import { SiteWrapper } from "@usace/groundwork";
import "@usace/groundwork/dist/groundwork.css";
import "./main.css";
import "@mdi/font/css/materialdesignicons.min.css";
import NavLinks from "./app-components/nav-links";

function App() {
  const {
    route: Route,
    authIsLoggedIn,
    pathname,
    doUpdateUrl,
    doAuthInit,
  } = useConnect(
    "selectRoute",
    "selectAuthIsLoggedIn",
    "selectPathname",
    "doUpdateUrl",
    "doAuthInit",
  );

  // Captured once on mount, before doAuthInit's checkForSession strips the
  // OAuth params from the URL. Lets us avoid bouncing the post-login redirect
  // back to "/" while the code-for-token exchange is still in flight.
  const [authInProgress] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!(params.get("code") && params.get("session_state"));
  });

  useEffect(() => {
    doAuthInit();
  }, [doAuthInit]);

  useEffect(() => {
    if (authIsLoggedIn && pathname === "/") {
      doUpdateUrl("/dashboard");
    } else if (!authIsLoggedIn && !authInProgress && pathname !== "/") {
      doUpdateUrl("/");
    }
  }, [authIsLoggedIn, authInProgress, pathname, doUpdateUrl]);
  return (
    <div
      onClick={getNavHelper((url) => {
        doUpdateUrl(url);
      })}
    >
      <SiteWrapper
        fluidNav={true}
        navRight={<NavLinks />}
        usaBanner={false}
        msgBanner={false}
        missionText="To facilitate low cost surveys to identify the quality of a structure inventory."
      >
        <div>
          <Route />
        </div>
      </SiteWrapper>
    </div>
  );
}

export default App;
