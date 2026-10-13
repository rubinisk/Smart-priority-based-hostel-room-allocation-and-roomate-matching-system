const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('staywise_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    throw new Error('Unable to connect to StayWise API backend. Please make sure the Python Flask server is running (python app.py on port 5001).');
  }

  if (!response.ok) {
    const errorMsg = data.error || data.message || 'An error occurred during request.';
    throw new Error(errorMsg);
  }

  return data as T;
}
