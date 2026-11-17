import cors from 'cors';
import path from 'path';
import server from '../utils/server/server';
import { registerRoutes } from './router';
import { loggerMiddleware } from './middleware';

process.loadEnvFile(path.resolve(process.cwd(), '.env'));

const app = server();

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS
  || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Requests without an Origin header are typically server-to-server or CLI requests.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin is not allowed by the CORS policy.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(loggerMiddleware);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(app.serverStatic('/storage', './storage'));

registerRoutes(app);

const port = Number.parseInt(process.env.PORT || '5000', 10);
app.listen(port, () => {
  console.log(`[AI-StudyMate] backend listening on port ${port}`);
});
