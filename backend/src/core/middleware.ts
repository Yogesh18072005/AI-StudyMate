export function loggerMiddleware(req: any, res: any, next: Function) {
  const startedAt = Date.now();
  const method = String(req.method || 'UNKNOWN');
  // Avoid logging query strings, which can accidentally contain sensitive values.
  const requestPath = String(req.url || '/').split('?')[0];

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `[${new Date().toISOString()}] ${method} ${requestPath} ${res.statusCode} ${durationMs}ms`,
    );
  });

  next();
}
