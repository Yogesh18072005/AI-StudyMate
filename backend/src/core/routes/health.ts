export function healthRoutes(app: any) {
  app.get("/healthz", (_req: any, res: any) => {
    res.send({
      ok: true,
      service: "ai-studymate-backend",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });
}
