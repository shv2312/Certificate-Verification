/**
 * API Client base configuration.
 *
 * All frontend requests to the FastAPI backend should go through this client.
 *
 * MOCK NOTE:
 * Backend is currently unavailable. This client is prepared for when the
 * backend integration is ready.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  // Future: Add auth token injection here once implemented
  // const token = sessionStorage.getItem('authToken');
  // if (token) {
  //   headers.set('Authorization', `Bearer ${token}`);
  // }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Attempt to parse backend error message
    let errorMessage = 'An unexpected error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // Ignore JSON parse errors for non-JSON responses
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (e.g., 204 No Content)
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}
