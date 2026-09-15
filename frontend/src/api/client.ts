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

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Server error: ${response.status} ${response.statusText}`;
    
    if (response.status === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (response.status === 401 || response.status === 403) {
      errorMessage = 'Your session may have expired. Please verify your email again.';
    }

    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Ignore parsing errors
      }
    } else {
      // If it's HTML or plain text, do not expose raw parser errors.
      errorMessage = 'Service temporarily unavailable. Please try again later.';
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (e.g., 204 No Content)
  const text = await response.text();
  if (!text) return {} as T;

  if (isJson) {
    return JSON.parse(text);
  } else {
    throw new Error('Received unexpected non-JSON response from the server.');
  }
}
