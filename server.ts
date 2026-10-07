import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from dist directory
const distPath = join(__dirname, 'dist');
app.use(express.static(distPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MindLedger Lite is running' });
});

// API endpoints (for future use)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for all routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 MindLedger Lite server is running on port ${port}`);
  console.log(`📝 Access the app at http://localhost:${port}`);
  console.log(`🏥 Environment: ${process.env.NODE_ENV || 'development'}`);
});
