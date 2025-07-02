
'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApiErrorResponse {
  message: string;
  errors?: { field: string; message: string }[]; // Optional detailed errors
}

export class ApiError extends Error {
  status: number;
  errorResponse?: ApiErrorResponse;

  constructor(message: string, status: number, errorResponse?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorResponse = errorResponse;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('TronUserToken') : null;
  
  const defaultHeaders: HeadersInit = {
    ...options.headers,
  };

  // Only set Content-Type if body is not FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: defaultHeaders,
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse = { message: `API Error: ${response.status} ${response.statusText}` };
    try {
      errorData = await response.json();
    } catch (e) {
      // If response is not JSON, use the generic message
    }
    console.error('API Error Details:', errorData);
    throw new ApiError(errorData.message || `Request failed with status ${response.status}`, response.status, errorData);
  }

  if (response.status === 204) { // No Content
    return null as T;
  }

  try {
    return await response.json();
  } catch (e) {
    console.error('API JSON Parse Error:', e);
    throw new ApiError('Failed to parse API response.', response.status);
  }
}

export default apiClient;
