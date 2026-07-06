import { getSession } from 'next-auth/react';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  // Try NextAuth session first
  const session = await getSession();
  let token = null;

  if (session) {
    // Use the apiToken from NextAuth session (generated during signIn)
    token = (session.user as any)?.apiToken;
  } else {
    // Fallback to localStorage token for regular login
    token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Only set Content-Type if it's not FormData (FormData sets it automatically with bounds)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error: ${response.status}`);
  }

  return response.json();
};
