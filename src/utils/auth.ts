const REFRESH_TOKEN_KEY = 'jb_refresh_token';

export const checkLoggedIn = (): boolean => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return false;
};
