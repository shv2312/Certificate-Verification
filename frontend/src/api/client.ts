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

    if (isJson) {
      let errorData: any = null;
      try {
        errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Ignore parsing errors
      }
      
      // Provide generic fallbacks only if JSON didn't provide a specific message
      if (!errorData?.detail && !errorData?.message) {
        if (response.status === 404) {
          errorMessage = 'The requested resource was not found.';
        } else if (response.status === 401) {
          errorMessage = 'Your session has expired or is invalid. Please verify your email again.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. You do not have permission to view this resource.';
        }
      }
    } else {
      // For non-JSON (HTML/Text) errors, be specific about routing failures
      if (response.status === 404) {
        errorMessage = 'API Route Not Found (Routing failure). Check your endpoint path.';
      } else if (response.status === 401) {
        errorMessage = 'Your session has expired or is invalid. Please verify your email again.';
      } else if (response.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view this resource.';
      } else {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      }
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
