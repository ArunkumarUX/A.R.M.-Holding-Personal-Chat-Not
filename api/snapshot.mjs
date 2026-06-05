import handler from './_vercelHandler.mjs';

/** Apify Bloomberg run-sync can take up to ~2 min */
export const config = { maxDuration: 120 };

export default handler;
