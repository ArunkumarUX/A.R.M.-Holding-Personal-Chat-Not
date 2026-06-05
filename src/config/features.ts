/**
 * Feature flags — baked in at build time (Vite).
 *
 * Opt in via env (see .env.example):
 *   VITE_ENABLE_PPT_MASTER=true
 *   VITE_ENABLE_ARCHITECTURE=true
 */
const isProdBuild = import.meta.env.PROD;

/** Create PPT / SlideAI — set VITE_ENABLE_PPT_MASTER=true at build time */
export const PPT_MASTER_ENABLED = import.meta.env.VITE_ENABLE_PPT_MASTER === 'true';

/** Architecture page — local/preview only by default */
export const ARCHITECTURE_ENABLED =
  !isProdBuild && import.meta.env.VITE_ENABLE_ARCHITECTURE === 'true';

/** Exposed for support / Settings diagnostics */
export const BUILD_FEATURES = {
  production: isProdBuild,
  pptMaster: PPT_MASTER_ENABLED,
  architecture: ARCHITECTURE_ENABLED,
} as const;
