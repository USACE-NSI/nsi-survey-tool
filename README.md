# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Deployment

The app calls the NSI API under `/nsiapi`. In development the Vite dev server
proxies this to `https://nsi.sec.usace.army.mil` (see `vite.config.js`). In
production, either reverse-proxy `/nsiapi` to the same host or set `VITE_NSI_BASE`
to point directly at the NSI base URL.

**Streaming requirement:** stratified survey generation consumes the NSI RFC 8142
feature stream (`?fmt=fs`) record-by-record so memory stays bounded regardless of
how large a perimeter polygon the user uploads. For this to work, the production
reverse proxy for `/nsiapi` **must stream the response through unbuffered** — e.g.
nginx `proxy_buffering off;` on that location. If the proxy buffers the full
response, the entire structure inventory is held in memory before the client sees
it, which defeats the streaming design and can exhaust memory on large polygons.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
