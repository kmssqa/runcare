import { existsSync } from 'node:fs';
if (existsSync('.env')) { try { process.loadEnvFile('.env'); } catch {} }
export const requireEnv = (n: string) => { const v = process.env[n]?.trim(); if (!v) throw new Error(`.env 에 ${n} 없음`); return v; };
