/**
 * src/api/client.ts
 * =================
 * Base HTTP API client for communication with the FastAPI backend.
 *
 * Implements:
 *   - Automatic session token injection (Bearer auth for HR & Admin)
 *   - Full backend envelope parsing ({ success, message, data } / { success: false, error_code, message, details })
 *   - Granular HTTP error differentiation (Network, 400 Bad Request, 401/403 Auth, 404, 409, 422 Validation, 500 Server)
 *   - Strong typing with custom ApiError class
 */

import { ApiError, type APIResponse, type APIErrorResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export { ApiError };
export type { APIResponse, APIErrorResponse };

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Core apiClient function for making requests to the FastAPI backend.
 * Returns the parsed JSON response of type T.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Token Injection: Admin Token vs HR Session Token
  if (endpoint.startsWith('/api/v1/admin') && endpoint !== '/api/v1/admin/login') {
    const adminToken = localStorage.getItem('siet_admin_token');
    if (adminToken) {
      headers.set('Authorization', `Bearer ${adminToken}`);
    }
  } else {
    const authStateStr = sessionStorage.getItem('siet_auth_state');
    if (authStateStr) {
      try {
        const authState = JSON.parse(authStateStr);
        if (authState.sessionToken) {
          headers.set('Authorization', `Bearer ${authState.sessionToken}`);
        }
      } catch {
        // Ignore parse errors on malformed storage
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
  } catch (netErr: any) {
    // Distinctly surface network failure (e.g. DNS failure, server unreachable, CORS)
    throw new ApiError(
      'Unable to connect to the SIET Verification server. Please verify your internet connection or check if the server is running.',
      0,
      'NETWORK_FAILURE',
      netErr
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Server error: ${response.status} ${response.statusText}`;
    let errorCode = 'HTTP_ERROR';
    let details: any = undefined;

    if (isJson) {
      try {
        const errorData: any = await response.json();
        
        // Check for custom backend envelope: { success: false, message, error_code, details }
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
          if (errorData.detail.message) {
            errorMessage = errorData.detail.message;
          }
          if (errorData.detail.error_code) {
            errorCode = errorData.detail.error_code;
          }
          // FastAPI pydantic validation errors: array of { loc, msg, type }
          if (Array.isArray(errorData.detail)) {
            const firstDetail = errorData.detail[0];
            const field = firstDetail?.loc?.slice(-1)[0] || 'field';
            errorMessage = `${field}: ${firstDetail?.msg || 'Validation failed'}`;
            details = errorData.detail;
          }
        }

        if (errorData.error_code) {
          errorCode = errorData.error_code;
        }
        if (errorData.details) {
          details = errorData.details;
        }
      } catch {
        // Fall back to HTTP status message
      }
    } else {
      // Non-JSON response error (e.g., proxy 502 / 504 / 404 HTML)
      try {
        const text = await response.text();
        if (text && text.length < 200 && !text.includes('<!DOCTYPE')) {
          errorMessage = text;
        }
      } catch {
        // ignore
      }
    }

    // Specific HTTP status code contextual enhancements if no explicit backend message
    if (!errorMessage || errorMessage.startsWith('Server error:')) {
      if (response.status === 400) {
        errorMessage = 'Invalid request parameters. Please check your inputs.';
        errorCode = 'BAD_REQUEST';
      } else if (response.status === 401) {
        errorMessage = 'Your session has expired or is invalid. Please verify your email again.';
        errorCode = 'UNAUTHORIZED';
      } else if (response.status === 403) {
        errorMessage = 'Access denied. You do not have permission to perform this action.';
        errorCode = 'FORBIDDEN';
      } else if (response.status === 404) {
        errorMessage = 'The requested verification resource was not found.';
        errorCode = 'NOT_FOUND';
      } else if (response.status === 409) {
        errorMessage = 'Conflict: The request could not be processed due to state conflicts or active cooldown.';
        errorCode = 'CONFLICT';
      } else if (response.status === 422) {
        errorMessage = 'Validation error: The submitted data does not meet schema requirements.';
        errorCode = 'UNPROCESSABLE_ENTITY';
      } else if (response.status === 503) {
        errorMessage = 'The verification service is temporarily undergoing maintenance. Please retry shortly.';
        errorCode = 'SERVICE_UNAVAILABLE';
      }
    }

    throw new ApiError(errorMessage, response.status, errorCode, details);
  }

  // Handle empty responses (e.g., 204 No Content)
  const text = await response.text();
  if (!text) return {} as T;

  if (isJson) {
    return JSON.parse(text) as T;
  } else {
    // Plain text or blob responses
    return text as unknown as T;
  }
}

/**
 * Convenience unwrapper that extracts the inner `data` payload
 * from the standard backend `APIResponse<T>`.
 */
export async function apiUnwrap<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const envelope = await apiClient<APIResponse<T>>(endpoint, options);
  if (envelope && typeof envelope === 'object' && 'data' in envelope) {
    return envelope.data;
  }
  return envelope as unknown as T;
}
