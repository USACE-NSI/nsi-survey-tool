import { createKeycloakAuthBundle } from "./create-keycloak-auth-bundle.js";

const authBundle = createKeycloakAuthBundle({
    keycloakUrl: import.meta.env.VITE_AUTH_URL,
    realm: import.meta.env.VITE_AUTH_REALM,
    client: import.meta.env.VITE_IDENTITY_CLIENT_ID,
    redirectUrl: import.meta.env.VITE_SILENT_REDIRECT_URL,
    flow: "browser",
    sessionEndWarning: 600,
});

export default authBundle;