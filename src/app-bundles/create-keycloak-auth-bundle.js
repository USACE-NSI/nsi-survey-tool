import { createSelector } from "redux-bundler";
import Keycloak from "../util/keycloak";

// utilities
const processResponse = (response) => {
    return new Promise((resolve, reject) => {
        const func = response.status < 400 ? resolve : reject;
        // Parse JSON for any 2xx response with a body. 204 No Content and error statuses get an empty object.
        const hasJsonBody =
            response.status >= 200 &&
            response.status < 300 &&
            response.status !== 204;
        if (!hasJsonBody) {
            func({ status: response.status, json: {} });
            return;
        }
        response
            .json()
            .then((json) => func({ status: response.status, json }))
            .catch(() => func({ status: response.status, json: {} }));
    });
};

const commonFetch = (url, options, callback) => {
    fetch(`${url}`, options)
        .then(processResponse)
        .then((response) => {
            if (callback && typeof callback === "function") {
                callback(null, response.json);
                return;
            }
        })
        .catch((response) => {
            const err = new ApiError(
                response.json,
                `Request returned a ${response.status}`,
            );
            if (callback && typeof callback === "function") {
                callback(err);
            } else {
                throw err;
            }
        })
        .catch((err) => {
            callback(err);
        });
};

class ApiError extends Error {
    constructor(data = {}, ...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }

        const dataKeys = Object.keys(data);

        this.name = "Api Error";
        this.timestamp = new Date();

        dataKeys.forEach((key) => {
            this[key] = data[key];
        });
    }
}

// See init: method
let keycloak = null;

const getTokenPart = function (token, part) {
    const splitToken = token.split(".");
    return splitToken[part];
};

//*********** Bundle Itself *//
const createKeycloakAuthBundle = (options) => {
    const defaults = {
        name: "auth",
        keycloakUrl: undefined,
        directGrantUrl: undefined,
        browserFlowUrl: undefined,
        refreshUrl: undefined,
        redirectUrl: undefined,
        realm: "default",
        client: "default",
        flow: "direct-grant", // default flow used by .login()
        refreshInterval: 300,
        sessionEndWarning: 600,
        mockToken: undefined,
    };

    const config = { ...defaults, ...options };

    // Set urls based on what was provided
    config.directGrantUrl = config.directGrantUrl || config.keycloakUrl;
    config.browserFlowUrl = config.browserFlowUrl || config.keycloakUrl;
    config.refreshUrl =
        config.refreshUrl || config.browserFlowUrl || config.keycloakUrl;

    // Selectors, Action Creators
    const uCaseName = config.name.charAt(0).toUpperCase() + config.name.slice(1);
    const doUpdate = `do${uCaseName}Update`;
    const doLogin = `do${uCaseName}Login`;
    const doLogout = `do${uCaseName}Logout`;
    const doInit = `do${uCaseName}Init`;
    const selectIsLoggedIn = `select${uCaseName}IsLoggedIn`;
    const selectToken = `select${uCaseName}Token`;
    const selectKeycloakResponse = `select${uCaseName}KeycloakResponse`;
    const selectTokenExp = `select${uCaseName}TokenExp`;
    const selectTokenIsExpired = `select${uCaseName}TokenIsExpired`;
    const selectTokenHeader = `select${uCaseName}TokenHeader`;
    const selectTokenPayload = `select${uCaseName}TokenPayload`;
    const selectIdentityPayload = `select${uCaseName}IdentityPayload`;
    const selectUsername = `select${uCaseName}Username`;
    const selectUserInitials = `select${uCaseName}UserInitials`;
    const selectRoles = `select${uCaseName}Roles`;
    const selectRolesObj = `select${uCaseName}RolesObj`;
    const selectRolesCaseInsensitiveObj = `select${uCaseName}RolesCaseInsensitiveObj`;
    const selectHasCodeFlowParams = `select${uCaseName}HasCodeFlowParams`;

    // Actions
    const capsName = config.name.toUpperCase();
    const ACTIONS = {
        UPDATED: `${capsName}_UPDATED`,
        LOGGED_OUT: `${capsName}_LOGGED_OUT`,
        VERIFY_TOKEN: `${capsName}_VERIFY_TOKEN`,
    };

    return {
        name: config.name,
        reducer: (
            state = { token: config.mockToken, keycloakResponse: null },
            { type, payload },
        ) => {
            switch (type) {
                case ACTIONS.UPDATED:
                case ACTIONS.LOGGED_OUT:
                    return { ...state, ...payload };
                default:
                    return state;
            }
        },
        [doLogin]: (overrides) => () => {
            const flow = overrides.flowOverride || config.flow;
            if (flow === "direct-grant") {
                keycloak.directGrantX509Authenticate(overrides);
            } else if (flow === "browser") {
                keycloak.authenticate(overrides);
            }
        },
        [doLogout]:
            () =>
                ({ dispatch }) => {
                    dispatch({ type: ACTIONS.LOGGED_OUT, payload: { token: null } });
                },
        [doUpdate]:
            (token, keycloakResponse) =>
                ({ dispatch }) => {
                    dispatch({
                        type: ACTIONS.UPDATED,
                        payload: { token: token, keycloakResponse: keycloakResponse },
                    });
                },
        [doInit]:
            () =>
                ({ store }) => {
                    if (store[selectHasCodeFlowParams]()) {
                        keycloak.checkForSession();
                    } else if (!config.mockToken && store[selectIsLoggedIn]()) {
                        if (store[selectTokenIsExpired]()) {
                            store[doLogout]();
                        } else {
                            const keycloakResponse = store[selectKeycloakResponse]();
                            keycloak.parseTokens(keycloakResponse);
                        }
                    }
                },
        [selectToken]: (state) => state[config.name].token,

        [selectKeycloakResponse]: (state) => state[config.name].keycloakResponse,

        [selectTokenHeader]: createSelector(selectToken, (token) => {
            if (!token) return {};
            return JSON.parse(window.atob(getTokenPart(token, 0)));
        }),

        [selectTokenPayload]: createSelector(selectToken, (token) => {
            if (!token) return {};
            return JSON.parse(window.atob(getTokenPart(token, 1)));
        }),
        [selectTokenExp]: createSelector(
            selectTokenPayload,
            (payload) => (payload && payload.exp) || null,
        ),
        [selectTokenIsExpired]: createSelector(selectTokenExp, (exp) => {
            if (!exp) return true;
            return exp < Math.floor(Date.now() / 1000);
        }),
        [selectRoles]: createSelector(selectTokenPayload, (payload) => {
            if (!Object.keys(payload).length || !config.client) {
                return [];
            }
            return (
                (payload.resource_access &&
                    payload.resource_access[config.client] &&
                    payload.resource_access[config.client].roles) ||
                []
            );
        }),
        [selectRolesObj]: createSelector(selectRoles, (roles) => {
            if (!roles || !roles.length) {
                return {};
            }
            const obj = {};
            roles.forEach((r) => {
                obj[r] = true;
            });
            return obj;
        }),
        [selectRolesCaseInsensitiveObj]: createSelector(selectRoles, (roles) => {
            if (!roles || !roles.length) {
                return {};
            }
            const obj = {};
            roles.forEach((r) => {
                obj[r.toUpperCase()] = true;
            });
            return obj;
        }),
        [selectIdentityPayload]: createSelector(selectKeycloakResponse, (resp) => {
            const idToken = resp && resp.id_token;
            if (!idToken) return {};
            try {
                return JSON.parse(window.atob(getTokenPart(idToken, 1)));
            } catch {
                return {};
            }
        }),
        [selectUsername]: createSelector(
            selectIdentityPayload,
            selectTokenPayload,
            (idPayload, accessPayload) => {
                const payload = idPayload.preferred_username ? idPayload : accessPayload;
                if (!payload || !Object.keys(payload).length) return null;
                return payload.preferred_username || null;
            },
        ),
        [selectUserInitials]: createSelector(selectUsername, (username) => {
            if (!username) {
                return null;
            }
            const parts = username.split(".");
            if (parts.length < 2) {
                return parts[0][0]?.toUpperCase() || "username empty";
            }
            return `${parts[1][0]}${parts[0][0]}`.toUpperCase();
        }),
        [selectIsLoggedIn]: createSelector(selectToken, (token) => {
            return token ? true : false;
        }),
        [selectHasCodeFlowParams]: () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get("code");
            const session_state = urlParams.get("session_state");
            return !!(code && session_state);
        },
        init: (store) => {
            const url = new URL(window.location.href);
            const redirectUrl = `${url.origin}${url.pathname}`;
            keycloak = new Keycloak({
                keycloakUrl: config.keycloakUrl,
                directGrantUrl: config.directGrantUrl,
                browserFlowUrl: config.browserFlowUrl,
                refreshUrl: config.refreshUrl,
                realm: config.realm,
                client: config.client,
                kc_idp_hint: "federation-eams",
                redirectUrl: redirectUrl,
                refreshInterval: config.refreshInterval,
                sessionEndWarning: config.sessionEndWarning,
                onAuthenticate: (token, keycloakResponse) => {
                    store[doUpdate](token, keycloakResponse);
                },
                onError: (err) => {
                    console.error("#################################");
                    console.error(err);
                    console.error("#################################");
                    store[doLogout]();
                },
                onSessionEnding: (remainingTime) => {
                    console.log(
                        `Remaining Session Time: ${remainingTime}; Logging out in 10s`,
                    );
                    window.setTimeout(store[doLogout], 10000);
                },
            });
            // Auth bootstrap (checkForSession / parseTokens) is deferred to
            // doAuthInit, which the app must dispatch from a useEffect after
            // mount. This guarantees subscriptions exist before the dispatch
            // fires (otherwise useConnect's subscription race drops updates).
        },

        // add some bonus fetch wrappers to use if you want
        getExtraArgs: (store) => {
            const defaultHeaders = (token) => ({
                Authorization: `Bearer ${token}`,
            });

            return {
                anonGet: (url, callback) => {
                    const options = {
                        method: "GET",
                    };
                    commonFetch(url, options, callback);
                },

                apiFetch: (url, options = { method: "GET" }) => {
                    const token = store[selectToken]();
                    let headers = defaultHeaders(token);
                    if (options.headers && typeof options.headers === "object") {
                        headers = { ...options.headers, ...headers };
                    }
                    options.headers = headers;
                    return fetch(url, options);
                },

                apiGet: (url, callback) => {
                    const options = { method: "GET" };
                    const token = store[selectToken]();
                    if (!token) {
                        return null;
                    } else {
                        options.headers = { ...defaultHeaders(token) };
                    }
                    commonFetch(url, options, callback);
                },

                apiPut: (url, payload, callback) => {
                    const options = {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    };
                    const token = store[selectToken]();
                    if (!token) {
                        return null;
                    } else {
                        options.headers = {
                            ...options.headers,
                            ...defaultHeaders(token),
                        };
                    }
                    if (payload) {
                        options.body = JSON.stringify(payload);
                    }
                    commonFetch(url, options, callback);
                },

                apiPost: (url, payload, callback) => {
                    const options = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    };
                    const token = store[selectToken]();
                    if (!token) {
                        return null;
                    } else {
                        options.headers = {
                            ...options.headers,
                            ...defaultHeaders(token),
                        };
                    }
                    if (payload) {
                        options.body = JSON.stringify(payload);
                    }

                    commonFetch(url, options, callback);
                },

                apiDelete: (url, payload, callback) => {
                    const options = {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    };
                    const token = store[selectToken]();
                    if (!token) {
                        return null;
                    } else {
                        options.headers = {
                            ...options.headers,
                            ...defaultHeaders(token),
                        };
                    }
                    if (payload) {
                        options.body = JSON.stringify(payload);
                    }
                    commonFetch(url, options, callback);
                },
            };
        },
        persistActions: [ACTIONS.UPDATED, ACTIONS.LOGGED_OUT],
    };
};

export { createKeycloakAuthBundle, createKeycloakAuthBundle as default };