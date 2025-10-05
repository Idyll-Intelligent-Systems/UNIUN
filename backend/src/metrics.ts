import client from 'prom-client';

export const register = new client.Registry();

export function setupMetrics() {
  client.collectDefaultMetrics({ register });
}
