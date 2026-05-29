import { useConnect } from "redux-bundler-hook";
import { LoginButton } from "@usace/groundwork";
import ProfileMenu from "./profile-menu";

export default function NavLinks() {
  const fwLinkHost = " https://www.hec.usace.army.mil/fwlink/?linkid=";
  const { authUsername, doAuthLogin } = useConnect(
    "selectAuthUsername",
    "doAuthLogin",
  );
  return (
    <div className="flex justify-between items-center bg-usace-black text-white rounded-2 p-2">
      {authUsername ? (
        <div className="gw-flex items-center">
          <a
            style={{
              padding: "5px",
              color: "rgb(208 208 208 / var(--tw-text-opacity, 1))",
              fontsize: ".875rem",
            }}
            href="/dashboard"
          >
            Dashboard
          </a>
          <div title={`Logged in as ${authUsername}`}>
            <ProfileMenu />{" "}
          </div>
          <a
            style={{ padding: "5px" }}
            target="_blank"
            title="Help for Survey Tool"
            href={`${fwLinkHost}nsi-survey-tool-splash-creation-help`}
          >
            <i className="mdi mdi-help-circle-outline" />
          </a>
        </div>
      ) : (
        <div className="gw-flex items-center">
          <LoginButton
            onClick={() => {
              doAuthLogin({
                flowOverride: "browser",
                kc_idp_hint: "login.gov",
                redirectUrl: window.location.origin + "/dashboard",
              });
            }}
          />
          <a
            target="_blank"
            title="Help for Survey Tool"
            href={`${fwLinkHost}nsi-survey-tool-splash-creation-help`}
          >
            <i className="mdi mdi-help-circle-outline" />
          </a>
        </div>
      )}
    </div>
  );
}
