# Tracking API Diagnostics for Sanjay

Hi Sanjay,

I reviewed the issue where the frontend tracking request is receiving an HTML response instead of JSON. 

## Root Cause
When the frontend Vite proxy encounters a `404 Not Found` for an API request (due to a typo in the URL path or an incorrect parameter), it falls back to serving `index.html` (the SPA fallback behavior). This is why you are receiving HTML instead of a JSON error response.

## Correct API Contract

Please ensure your tracking request exactly matches the following contract:

**Endpoint:** `GET /api/v1/verification/{request_id}/status`
*(Note: Replace `{request_id}` with the actual ID, e.g., `GET /api/v1/verification/BGV-2026-000001/status`)*

**Authentication:** 
You MUST include the session token in the headers.
```http
Authorization: Bearer <your_session_token>
```

**Expected JSON Response (Success):**
```json
{
  "success": true,
  "message": "Request status: IN_PROGRESS",
  "data": {
    "status": "IN_PROGRESS"
  }
}
```

### Important Notes:
1. **Do not use `/api/v1/verification/status/{request_id}`** – the `status` part comes *after* the request ID.
2. If you omit the `Authorization` header, the backend will return a `401 Unauthorized` JSON response. If your HTTP client or Vite proxy masks this and redirects to login (serving HTML), please check the network tab for the raw 401 response.
3. The backend does not mask configuration failures as "request-not-found" (404). If the ID doesn't exist, it currently returns a `500` or a specific API error, but not a 404 that would trigger the Vite HTML fallback. The HTML response is strictly a path mismatch issue at the Vite proxy level.
