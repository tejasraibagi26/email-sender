import 'dotenv/config';
import express from 'express';
import { loadAndRegisterJobs } from './lib/scheduler.js';
import healthRouter from './routes/health.js';
import sendRouter from './routes/send.js';
import scheduleRouter from './routes/schedule.js';

const REQUIRED_ENV = [
  'API_KEY',
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
app.use(express.json());

app.use('/health', healthRouter);
app.use('/send', sendRouter);
app.use('/jobs', scheduleRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

const PORT = process.env.PORT || 3002;

try {
  await loadAndRegisterJobs();
  app.listen(PORT, () => console.log(`email-service running on port ${PORT}`));
} catch (err) {
  console.error('Startup failed:', err.message);
  process.exit(1);
}
