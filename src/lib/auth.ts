import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from './db';
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    storage: 'database',
    modelName: 'AuthRateLimit',
  },
  advanced: { cookiePrefix: 'marketpulse' },
});
