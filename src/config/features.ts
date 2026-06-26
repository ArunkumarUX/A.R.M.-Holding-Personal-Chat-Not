/**
 * Feature flags — baked in at build time (Vite).
 *
 * Opt in via env (see .env.example):
 *   VITE_ENABLE_ARCHITECTURE=true
 */
const isProdBuild = import.meta.env.PROD;

/** Create PPT / SlideAI — enabled for A.R.M. Holding executive release */
export const PPT_MASTER_ENABLED = true;

/** Architecture page — local/preview only by default */
export const ARCHITECTURE_ENABLED =
  !isProdBuild && import.meta.env.VITE_ENABLE_ARCHITECTURE === 'true';

/** AI Presentation Builder wizard — hidden; SlideAI at /create-ppt is the primary PPT flow */
export const PRESENTATION_BUILDER_ENABLED = false;

/** Exposed for support / Settings diagnostics */
export const BUILD_FEATURES = {
  production: isProdBuild,
  pptMaster: PPT_MASTER_ENABLED,
  architecture: ARCHITECTURE_ENABLED,
  presentationBuilder: PRESENTATION_BUILDER_ENABLED,
} as const;
