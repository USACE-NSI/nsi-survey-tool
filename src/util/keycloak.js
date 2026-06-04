const urlencodeFormData = (fd) => new URLSearchParams([...fd]);

// PKCE (RFC 7636) S256: 32 random bytes -> base64url verifier; SHA-256 of the
// verifier -> base64url challenge. The verifier is stashed in sessionStorage
// so the token exchange after the auth redirect can present it.
const PKCE_VERIFIER_KEY = "pkce_code_verifier";

const base64UrlEncode = (buffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");

const generatePkcePair = async () => {
    const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
    const verifier = base64UrlEncode(verifierBytes.buffer);
    const challengeBytes = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(verifier),
    );
    const challenge = base64UrlEncode(challengeBytes);
    return { verifier, challenge };
};

class Keycloak {
    constructor(opts) {
        // default values
        const defaults = {
            accessToken: undefined,
            client: undefined,
            identityToken: undefined,
            kc_idp_hint: "login.gov",
            keycloakUrl: undefined,
            directGrantUrl: undefined,
            browserFlowUrl: undefined,
            logoutUrl: undefined,
            redirectUrl: undefined,
            refreshUrl: undefined,
            realm: undefined,
            refreshToken: undefined,
            refreshInterval: undefined, // if configured will override interval returned by keycloak
            refreshBuffer: 60, // 1 minute in seconds
            sessionEndWarning: 60, // 1 minute in seconds
            scope: "openid profile",

            onSessionEnding: undefined,
            onAuthenticate: undefined,
            onError: (msg) => {
                throw new Error(`Keycloak-js Error: ${msg}`);
            },
            onLogout: undefined,
        };

        const config = { ...defaults, ...opts };

        this.accessToken = config.accessToken;
        this.client = config.client;
        this.code = undefined;
        this.identityToken = config.identityToken;
        this.kc_idp_hint = config.kc_idp_hint;
        this.keycloakUrl = config.keycloakUrl;
        this.directGrantUrl = config.directGrantUrl || config.keycloakUrl;
        this.browserFlowUrl = config.browserFlowUrl || config.keycloakUrl;
        this.logoutUrl = config.logoutUrl || config.keycloakUrl;
        this.redirectUrl = config.redirectUrl;
        this.refreshUrl = config.refreshUrl || config.keycloakUrl;
        this.realm = config.realm;
        this.refreshToken = config.refreshToken;
        this.refreshInterval = config.refreshInterval;
        this.refreshBuffer = config.refreshBuffer;
        this.sessionState = undefined;
        this.sessionTimeout = undefined;
        this.sessionEndWarning = config.sessionEndWarning;
        this.scope = config.scope;

        this.onSessionEnding = config.onSessionEnding;
        this.onAuthenticate = config.onAuthenticate;
        this.onError = config.onError;
        this.onLogout = config.onLogout;
    }

    async authenticate(overrides) {
        // allow run-time overrides of some of the config
        // this lets you switch between login.gov or eams-a for the
        // browser flow or use a different redirect url depending
        // on where a user is when they login.
        const realm = overrides.realm || this.realm;
        const kc_idp_hint = overrides.kc_idp_hint || this.kc_idp_hint;
        const redirectUrl = overrides.redirectUrl || this.redirectUrl;

        const { verifier, challenge } = await generatePkcePair();
        sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);

        const url = `${this.browserFlowUrl
            }/realms/${realm}/protocol/openid-connect/auth?response_type=code&kc_idp_hint=${kc_idp_hint}&client_id=${this.client
            }&scope=openid&redirect_uri=${redirectUrl}&code_challenge=${challenge}&code_challenge_method=S256&nocache=${new Date().getTime()}`;
        window.location.href = url;
    }

    checkForSession() {
        const urlParams = new URLSearchParams(window.location.search);
        this.code = urlParams.get("code");
        this.sessionState = urlParams.get("session_state");
        if (this.code && this.sessionState) {
            this.codeFlowAuth();
            window.history.pushState(null, null, document.location.pathname);
        }
    }

    _getRefreshInterval(expiresIn) {
        // Already expired / nearly expired — refresh now.
        if (expiresIn <= 1) return 1000;

        // Scale the safety buffer down for short-lived tokens so we don't end
        // up scheduling refreshes inside the buffer window (which would cause
        // a tight refresh loop). Cap the buffer at 25% of the token lifetime.
        const buffer = Math.min(this.refreshBuffer, Math.floor(expiresIn / 4));
        const naturalInterval = (expiresIn - buffer) * 1000;

        // A configured refreshInterval is a ceiling (refresh at least this often),
        // never an override that can exceed the token's real lifetime.
        let interval = naturalInterval;
        if (this.refreshInterval) {
            interval = Math.min(naturalInterval, this.refreshInterval * 1000);
        }

        if (interval < 1000) return 1000;
        return interval;
    }

    _tokenRemainingSecs(token) {
        if (!token) return null;
        try {
            const payload = JSON.parse(window.atob(token.split(".")[1]));
            if (!payload.exp) return null;
            return payload.exp - Math.floor(Date.now() / 1000);
        } catch {
            return null;
        }
    }

    clearTokens() {
        this.accessToken = null;
        this.identityToken = null;
        this.refreshToken = null;
    }

    parseTokens(keycloakResp) {
        // Get our tokens from the response.
        const tokens = {
            ...{
                access_token: null,
                id_token: null,
                refresh_token: null,
                expires_in: 0,
                refresh_expires_in: 0,
            },
            ...keycloakResp,
        };

        this.accessToken = tokens.access_token;
        this.identityToken = tokens.id_token;
        this.refreshToken = tokens.refresh_token;

        // Prefer the JWT's exp claim over expires_in. expires_in is the TTL at issue
        // time and becomes stale once the response is persisted across reloads.
        const remainingFromJwt = this._tokenRemainingSecs(this.accessToken);
        const remainingSecs =
            remainingFromJwt !== null ? remainingFromJwt : tokens.expires_in;

        // If the session is within our warning threshold pop the warning
        if (tokens.refresh_expires_in <= this.sessionEndWarning) {
            if (typeof this.onSessionEnding === "function")
                this.onSessionEnding(tokens.refresh_expires_in);
        }

        // Set the refresh timeout based on when the token expires
        if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
        this.sessionTimeout = setTimeout(() => {
            this.refresh();
        }, this._getRefreshInterval(remainingSecs));

        // Trigger the success callback, provide access token and raw keycloak response to callback
        if (typeof this.onAuthenticate === "function")
            this.onAuthenticate(this.accessToken, keycloakResp);
    }

    fetch(url, data, onSuccess, onError = this.onError) {
        let self = this;
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onload = function () {
            let resp = {};
            try {
                resp = JSON.parse(xhr.responseText);
            } catch (err) {
                return onError(`Error parsing keycloak response ${err}`);
            }

            if (xhr.status !== 200) {
                self.clearTokens();
                onError(resp);
            } else {
                onSuccess(resp);
            }
        };
        xhr.onerror = function () {
            if (xhr.responseText) {
                try {
                    onError(JSON.parse(xhr.responseText));
                } catch (err) {
                    onError({ error: "Error parsing response from keycloak" + err });
                }
            } else {
                onError({
                    error: "Unable to fetch the token due to a Network Error",
                });
            }
        };
        xhr.ontimeout = function () {
            if (xhr.responseText) {
                try {
                    onError(JSON.parse(xhr.responseText));
                } catch (err) {
                    onError({ error: "Error parsing response from keycloak" + err });
                }
            } else {
                onError({
                    error: "Unable to fetch the token due to a Network Timeout Error",
                });
            }
        };
        xhr.send(urlencodeFormData(data));
    }

    codeFlowAuth() {
        const url = `${this.browserFlowUrl}/realms/${this.realm}/protocol/openid-connect/token`;
        const data = new FormData();
        data.append("code", this.code);
        data.append("grant_type", "authorization_code");
        data.append("client_id", this.client);
        data.append("redirect_uri", this.redirectUrl);
        const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
        if (verifier) {
            data.append("code_verifier", verifier);
            sessionStorage.removeItem(PKCE_VERIFIER_KEY);
        }
        this.fetch(url, data, this.parseTokens.bind(this));
    }

    refresh() {
        const url = `${this.refreshUrl}/realms/${this.realm}/protocol/openid-connect/token`;
        const data = new FormData();
        data.append("refresh_token", this.refreshToken);
        data.append("grant_type", "refresh_token");
        data.append("client_id", this.client);
        this.fetch(url, data, this.parseTokens.bind(this));
    }

    directGrantAuthenticate(user, pass) {
        const url = `${this.directGrantUrl}/realms/${this.realm}/protocol/openid-connect/token`;
        const data = new FormData();
        data.append("grant_type", "password");
        data.append("client_id", this.client);
        data.append("scope", this.scope);
        data.append("username", user);
        data.append("password", pass);
        this.fetch(url, data, this.parseTokens.bind(this));
    }

    directGrantX509Authenticate(overrides) {
        const realm = overrides.realm || this.realm;
        const scope = overrides.scope || this.scope;
        const url = `${this.directGrantUrl}/realms/${realm}/protocol/openid-connect/token`;
        const data = new FormData();
        data.append("grant_type", "password");
        data.append("client_id", this.client);
        data.append("scope", scope);
        data.append("username", "");
        data.append("password", "");
        this.fetch(url, data, this.parseTokens.bind(this));
    }

    getAccessToken() {
        return this.accessToken;
    }

    getIdentityToken() {
        return this.identityToken;
    }

    logout({ redirect = true } = {}) {
        if (!this.logoutUrl) {
            console.log("Configure a logout URL to enable Keycloak Logout flow");
            return;
        }

        const base = `${this.logoutUrl}/realms/${this.realm}/protocol/openid-connect/logout`;
        const params = new URLSearchParams();

        if (this.identityToken) params.append("id_token_hint", this.identityToken);
        if (this.client) params.append("client_id", this.client);

        if (redirect && this.redirectUrl) {
            params.append("post_logout_redirect_uri", this.redirectUrl);
            window.location.href = `${base}?${params}`;
        } else {
            if (this.refreshToken) params.append("refresh_token", this.refreshToken);
            this.clearTokens();
            this.fetch(base, params, () => {
                if (typeof this.onLogout === "function") this.onLogout();
            });
        }
    }
}

const tokenToObject = function (token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(function (c) {
                    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join("")
        );
        return JSON.parse(jsonPayload);
    } catch (err) {
        console.log("Error parsing token: ", err);
        return null;
    }
};

export { Keycloak as default, tokenToObject };