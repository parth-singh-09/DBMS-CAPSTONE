import { app } from './app.js';
import { testConnection } from './config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  console.log('================================================================');
  console.log('Starting E-Commerce DBMS Backend Server...');
  console.log('================================================================');

  // Verify DB connection
  const dbStatus = await testConnection();
  if (!dbStatus.connected) {
    console.error('❌ Failed to connect to MySQL database:', dbStatus.error);
    process.exit(1);
  }

  console.log(`✓ Connected to MySQL database \`${process.env.DB_NAME || 'shop'}\` (MySQL ${dbStatus.version})`);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Backend REST API server is listening on port ${PORT}`);
    console.log(`✓ API Health Check: http://0.0.0.0:${PORT}/health`);
    console.log(`✓ API Endpoints Root: http://0.0.0.0:${PORT}/api`);
    console.log('================================================================\n');
  });
}

startServer();
