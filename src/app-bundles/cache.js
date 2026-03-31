/* eslint-disable no-undef */
import { getConfiguredCache } from "money-clip";
const name = import.meta.env.VITE_APP_NAME;
const version = import.meta.env.VITE_APP_VERSION;

const cacheKey = `${name}-${version}`;

export default getConfiguredCache({
    maxAge: 1000 * 60 * 60 * 24,
    version: cacheKey,
});