/**
 * Global Error Handling Middleware
 */
module.exports = (err, req, res, next) => {
  // Log full stack trace internally
  console.error('[App Error]:', err.stack || err.message);

  // Default parameters
  let statusCode = 500;
  let errorMessage = 'An unexpected internal server error occurred.';

  // If the error was returned from our Axios githubClient or custom handlers
  if (err.response) {
    statusCode = err.response.status;
    errorMessage = err.message || 'GitHub API connection failure.';
  } else if (err.status) {
    statusCode = err.status;
    errorMessage = err.message;
  } else if (err.message && (err.message.includes('Rate Limit') || err.message.includes('not found'))) {
    // Custom messages set during interceptors or controller validation
    statusCode = err.message.includes('not found') ? 404 : 403;
    errorMessage = err.message;
  }

  res.status(statusCode).json({
    error: errorMessage,
    status: statusCode
  });
};
