import { useConnect } from "redux-bundler-hook";
import { getNavHelper } from "internal-nav-helper";
import { SiteWrapper, LoginButton, ProfileDropdown } from "@usace/groundwork";
import "@usace/groundwork/dist/groundwork.css";
import "./main.css";
import "@mdi/font/css/materialdesignicons.min.css";
import NavLinks from "./app-components/nav-links";

function App() {
  const { route: Route, doUpdateUrl } = useConnect(
    "selectRoute",
    "doUpdateUrl"
  );
  return (
    <div
      onClick={getNavHelper((url) => {
        doUpdateUrl(url);
      })}
    >
      <SiteWrapper fluidNav={true} navRight={<NavLinks />}>
        <div>
          <Route />
        </div>
      </SiteWrapper>
    </div>
  );
}

export default App;
