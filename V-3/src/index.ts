import dotenv from 'dotenv';
dotenv.config();

import { MessageRepository } from './db.js';
import { OpsManager } from './ops.js';
import { ApiClient } from './api.js';
import { AiGuide } from './ai-guide.js';
import { IntentEngine } from './intent-engine.js';
import { DashboardServer } from './dashboard.js';
import { WhatsAppGateway } from './whatsapp.js';

async function bootstrap() {
  console.log('==================================================');
  console.log('       WHATSAPP_BOT_404_V3 (ENTERPRISE EDITION)    ');
  console.log('              Architect & Owner: Rutaab           ');
  console.log('==================================================\n');

  // 1. Initialize MariaDB Connection & Schema
  console.log('[Bootstrap] Initializing MariaDB repository...');
  const db = new MessageRepository({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bot_404'
  });

  try {
    await db.initializeSchema();
    console.log('[Bootstrap] Database connected and schema verified successfully.');
  } catch (err: any) {
    console.warn(`[Bootstrap] Notice: Database connection deferred (${err.message}). Retrying in background.`);
  }

  // 2. Initialize Telemetry & Health Server (Port 8787)
  const healthPort = parseInt(process.env.HEALTH_PORT || '8787', 10);
  const ops = new OpsManager(healthPort);
  ops.startHealthServer(() => ({
    owner: process.env.OWNER_NAME || 'Rutaab',
    version: '3.0.0'
  }));
  console.log(`[Bootstrap] Ops health & metrics server running on port ${healthPort}`);

  // 3. Centralized API Client & Fallbacks (Voice transcription configured with dedicated key)
  const groqVoiceKey = process.env.GROQ_API_KEY_VOICE || process.env.GROQ_API_KEY || '';
  const groqChatKey = process.env.GROQ_API_KEY_CHAT || process.env.GROQ_API_KEY || '';

  const api = new ApiClient(
    db,
    process.env.API_BASE_URL || 'https://ahm7xmakki.com',
    process.env.COBALT_API_URL || 'https://api.cobalt.tools',
    groqVoiceKey,
    groqChatKey // fallback
  );

  // 4. AI Guide & Autonomous Intent Engine (Chat LLM configured with dedicated key)
  const aiGuide = new AiGuide(
    db,
    groqChatKey,
    process.env.OWNER_NAME || 'Rutaab',
    process.env.BOT_NAME || 'BOT_404_V3',
    groqVoiceKey // fallback
  );

  const intentEngine = new IntentEngine(process.env.OWNER_NAME || 'Rutaab');

  // 5. Material Design 3 Web Dashboard (Port 8788)
  const dashboardPort = parseInt(process.env.DASHBOARD_PORT || '8788', 10);
  const dashboard = new DashboardServer(db, ops, dashboardPort);
  dashboard.start();

  // 6. WhatsApp Baileys Gateway
  const gateway = new WhatsAppGateway(
    db,
    ops,
    api,
    aiGuide,
    intentEngine,
    process.env.AUTH_DIR || 'auth_info',
    process.env.OWNER_NUMBER || '923192342358'
  );

  await gateway.start();

  // 7. Background Data Retention Sweeper (Runs every 24 hours)
  const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '30', 10);
  setInterval(async () => {
    try {
      const deletedCount = await db.cleanupOldMessages(retentionDays);
      if (deletedCount > 0) {
        console.log(`[Maintenance] Retention cycle purged ${deletedCount} messages older than ${retentionDays} days.`);
      }
    } catch (e: any) {
      console.warn('[Maintenance] Retention cycle skipped:', e.message);
    }
  }, 24 * 60 * 60 * 1000);

  // 8. Graceful Shutdown Handlers
  const shutdown = async (signal: string) => {
    console.log(`\n[Shutdown] Received ${signal}. Gracefully shutting down...`);
    ops.stopHealthServer();
    dashboard.stop();
    await db.close();
    console.log('[Shutdown] All services cleanly terminated.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[Fatal Error] Failed to bootstrap application:', err);
  process.exit(1);
});
