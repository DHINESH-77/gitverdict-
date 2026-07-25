const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Log token status on startup
if (GITHUB_TOKEN) {
  console.log(`[GitHub] Token loaded ✓ (${GITHUB_TOKEN.slice(0, 8)}...) — 5,000 req/hr rate limit active`);
} else {
  console.warn('[GitHub] ⚠ No GITHUB_TOKEN found — unauthenticated (60 req/hr limit). Add token to backend/.env');
}

// Initialize Axios client configured for GitHub's REST API
const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` })
  }
});

// Response interceptor to format errors nicely
githubClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle rate limit errors
      if (error.response.status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
        const resetTime = new Date(error.response.headers['x-ratelimit-reset'] * 1000).toLocaleTimeString();
        error.message = `GitHub API Rate Limit exceeded. Resets at ${resetTime}.`;
      } else if (error.response.status === 404) {
        error.message = 'Requested GitHub profile or resources not found.';
      }
    }
    return Promise.reject(error);
  }
);

module.exports = githubClient;
