/** Secure access — AD SSO / MFA integration ready */
export const ACCESS_PIN = '9898';

/** Executive Home (sidebar “Home”) */
export const HOME_PATH = '/dashboard';

/** Post-login welcome + feature tour */
export const WELCOME_PATH = '/welcome';

/** Main Personal AI chat */
export const CHAT_PATH = '/chat';

export const AUTH_STORAGE_KEY = 'adgm_auth_v1';

export type StoredAuth = {
  token: string;
  welcomeComplete?: boolean;
  tourComplete?: boolean;
  /** @deprecated Use welcomeComplete + tourComplete */
  onboardingComplete?: boolean;
  verifiedAt: number;
};
