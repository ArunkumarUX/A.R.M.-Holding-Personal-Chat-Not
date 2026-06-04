/**
 * Feature flags — baked in at build time (Vite).
 *
 * Production (Netlify): Architecture and Create PPT are ALWAYS hidden.
 * Local dev: opt in via .env.local (see .env.example).
 */
const isProdBuild = import.meta.env.PROD;

/** Create PPT / SlideAI — dev only unless you change isProdBuild guard */
export const PPT_MASTER_ENABLED =
  !isProdBuild && import.meta.env.VITE_ENABLE_PPT_MASTER === 'true';

/** Architecture page — disabled on all production deploys */
export const ARCHITECTURE_ENABLED =
  !isProdBuild && import.meta.env.VITE_ENABLE_ARCHITECTURE === 'true';

/** Exposed for support / Settings diagnostics */
export const BUILD_FEATURES = {
  production: isProdBuild,
  pptMaster: PPT_MASTER_ENABLED,
  architecture: ARCHITECTURE_ENABLED,
} as const;
