const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Fetches the scoring analysis for a GitHub user.
 * @param {string} username 
 */
export async function fetchVerdict(username) {
  const response = await fetch(`${API_BASE}/api/verdict/${encodeURIComponent(username.trim())}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || `Request failed with status code ${response.status}.`;
    throw new Error(message);
  }
  
  return response.json();
}
