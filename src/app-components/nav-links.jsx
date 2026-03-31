import { useConnect } from "redux-bundler-hook";
import { LoginButton, ProfileDropdown } from "@usace/groundwork";

export default function NavLinks() {
  const fwLinkHost = " https://www.hec.usace.army.mil/fwlink/?linkid=";
  const { user, doUpdateUrl, doUpdateUser } = useConnect(
    "selectUser",
    "doUpdateUrl",
    "doUpdateUser"
  );
  const setEmail = (input) => {
    doUpdateUser({ name: input, canCreateNewSurvey: true }); /// base user canCreateNewSurvey based on roles in rba model.
  };
  return (
    <div className="flex justify-between items-center bg-usace-black text-white rounded-2 p-2">
      {user.name ? (
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
          <div title={`Logged in as ${user.name}`}>
            <ProfileDropdown
              style={{ padding: "5px" }}
              email={user.name}
              showLogout
              onLogout={() => {
                setEmail(null);
              }}
              links={[
                {
                  id: "profile",
                  text: "View Profile",
                  link: "#",
                },
              ]}
            />{" "}
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
              // implement real login logic here
              const unsafe_input = window.prompt("Enter your e-mail address");
              if (unsafe_input) {
                setEmail(unsafe_input);
                doUpdateUrl("/dashboard");
              }
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
