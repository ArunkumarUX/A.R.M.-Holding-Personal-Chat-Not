import { handleApiRequest } from '../../server/apiRouter.mjs';
import { createAuthSessionStore } from '../../server/authSessionStore.mjs';

export default async (request) => handleApiRequest(request, { sessionStore: createAuthSessionStore });
