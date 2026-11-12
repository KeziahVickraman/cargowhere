import type { Request, Response } from 'express';

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  ltaKeyConfigured: boolean;
  service: string;
  version: string;
}

export async function handleHealth(req: Request, res: Response) {
  const ltaKey = process.env.LTA_ACCOUNT_KEY || process.env.ACCOUNT_KEY;

  const data: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    ltaKeyConfigured: Boolean(ltaKey && ltaKey.trim().length > 0),
    service: 'ParkSG LTA DataMall Serverless API',
    version: '1.0.0',
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).json(data);
}

// Default export compatible with serverless function runtimes (e.g. Vercel, Express)
export default handleHealth;
