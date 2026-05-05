export function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      issues: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: status >= 500 && process.env.NODE_ENV === 'production' ? 'Unexpected server error' : err.message || 'Unexpected server error'
  });
}
