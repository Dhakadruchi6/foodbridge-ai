import { getToken } from './auth';

async function handleResponse(response: Response) {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'API request failed');
  }
  return result;
}

export const getRequest = async (url: string) => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { method: 'GET', headers });
  return handleResponse(response);
};

export const postRequest = async (url: string, data: any) => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const patchRequest = async (url: string, data: any) => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};
