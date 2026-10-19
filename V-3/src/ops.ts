import http from 'node:http';
import os from 'node:os';

export interface ProcessTelemetry {
  uptimeSeconds: number;
  uptimeFormatted: string;
  memoryRssMb: number;
  memoryHeapUsedMb: number;
  memoryHeapTotalMb: number;
  cpuLoadAvg: number[];
  nodeVersion: string;
  platform: string;
}

export class OpsManager {
  private startTime = Date.now();
  private healthServer: http.Server | null = null;
  private rateLimitMap = new Map<string, number[]>();

  constructor(private port: number = 8787) {}

  public getTelemetry(): ProcessTelemetry {
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
    const d = Math.floor(uptimeSec / 86400);
    const h = Math.floor((uptimeSec % 86400) / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const s = uptimeSec % 60;
    const uptimeFormatted = `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;

    return {
      uptimeSeconds: uptimeSec,
      uptimeFormatted,
      memoryRssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      memoryHeapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      memoryHeapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      cpuLoadAvg: os.loadavg(),
      nodeVersion: process.version,
      platform: `${os.platform()} (${os.arch()})`
    };
  }

  public checkRateLimit(jid: string, maxRequestsPerMinute: number = 20): { allowed: boolean; remaining: number; resetSec: number } {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const windowStart = now - windowMs;

    const timestamps = this.rateLimitMap.get(jid) || [];
    const valid = timestamps.filter(t => t > windowStart);

    if (valid.length >= maxRequestsPerMinute) {
      const oldest = valid[0];
      const resetSec = Math.ceil((oldest + windowMs - now) / 1000);
      return { allowed: false, remaining: 0, resetSec };
    }

    valid.push(now);
    this.rateLimitMap.set(jid, valid);

    // Periodically sweep old map entries
    if (this.rateLimitMap.size > 1000) {
      for (const [key, list] of this.rateLimitMap.entries()) {
        if (list.length === 0 || list[list.length - 1] < windowStart) {
          this.rateLimitMap.delete(key);
        }
      }
    }

    return { allowed: true, remaining: maxRequestsPerMinute - valid.length, resetSec: 60 };
  }

  public startHealthServer(customStatsProvider?: () => Record<string, any>): void {
    if (this.healthServer) return;

    this.healthServer = http.createServer((req, res) => {
      const url = req.url || '/';

      if (url === '/health' || url === '/') {
        const telemetry = this.getTelemetry();
        const custom = customStatsProvider ? customStatsProvider() : {};
        const responseData = {
          status: 'ok',
          service: 'WHATSAPP_BOT_404_V3',
          telemetry,
          ...custom,
          timestamp: new Date().toISOString()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseData, null, 2));
        return;
      }

      if (url === '/metrics') {
        const mem = process.memoryUsage();
        const metrics = [
          `# HELP bot_uptime_seconds Process uptime in seconds`,
          `# TYPE bot_uptime_seconds gauge`,
          `bot_uptime_seconds ${Math.floor((Date.now() - this.startTime) / 1000)}`,
          `# HELP bot_memory_rss_bytes Resident set size in bytes`,
          `# TYPE bot_memory_rss_bytes gauge`,
          `bot_memory_rss_bytes ${mem.rss}`,
          `# HELP bot_memory_heap_used_bytes Memory heap used in bytes`,
          `# TYPE bot_memory_heap_used_bytes gauge`,
          `bot_memory_heap_used_bytes ${mem.heapUsed}`,
        ].join('\n');

        res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
        res.end(metrics);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    });

    this.healthServer.listen(this.port, () => {
      // Health server running
    });

    this.healthServer.on('error', (err) => {
      console.error(`[OpsManager] Health server error on port ${this.port}:`, err.message);
    });
  }

  public stopHealthServer(): void {
    if (this.healthServer) {
      this.healthServer.close();
      this.healthServer = null;
    }
  }
}
