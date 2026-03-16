const COOKIE_NAME = 'token';

export const saveToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    // Set cookie for middleware
    document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=86400; SameSite=Lax`;
  }
};

export const setToken = saveToken;

export const getToken = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token === 'undefined' || token === 'null') return null;
    return token;
  }
  return null;
};

// Utility to get cookie on server or client
export const getCookie = (name: string, cookieString?: string) => {
  const value = `; ${cookieString || (typeof document !== 'undefined' ? document.cookie : '')}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    window.location.href = '/login';
  }
};

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }
};

export const getUserRole = (tokenParam?: string) => {
  const token = tokenParam || getToken();
  if (!token) return null;

  try {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const payload = JSON.parse(atob(base64));
    return payload.role;
  } catch (e) {
    console.error("Token decode error:", e);
    return null;
  }
};

export const isAuthenticated = () => {
  return !!getToken();
};
