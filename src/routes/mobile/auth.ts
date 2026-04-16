import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

function generateSecureToken(length = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

async function generateTokenPair(fastify: FastifyInstance, prisma: any, user: any, deviceId?: string) {
  const accessToken = (fastify as any).jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: 'access' },
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  return { accessToken, refreshToken, expiresIn: 900, refreshExpiresAt: expiresAt.toISOString() };
}

export default async function mobileAuthRoutes(fastify: FastifyInstance) {
  const prisma = (fastify as any).prisma;
  const { authenticateUser } = await import('../../middleware/authUser.js');

  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password, deviceId } = request.body as any;
      if (!email || !password) {
        return reply.code(400).send({ ok: false, error: 'Email and password are required', code: 'MISSING_CREDENTIALS' });
      }
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user || !user.password) {
        return reply.code(401).send({ ok: false, error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return reply.code(401).send({ ok: false, error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
      }
      const tokens = await generateTokenPair(fastify, prisma, user, deviceId);
      const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
      return reply.send({
        ok: true,
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          name: profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || null : null,
          phone: profile?.phone || null,
          role: user.role
        }
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
    }
  });

  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { name, email, password, phone } = request.body as any;
      if (!email || !password) {
        return reply.code(400).send({ ok: false, error: 'Email and password are required', code: 'MISSING_FIELDS' });
      }
      if (password.length < 8) {
        return reply.code(400).send({ ok: false, error: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' });
      }
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) {
        return reply.code(409).send({ ok: false, error: 'An account with this email already exists', code: 'EMAIL_EXISTS' });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { email: email.toLowerCase(), password: hashedPassword, role: 'BUYER' }
      });
      const [firstName, ...lastParts] = (name || '').split(' ');
      await prisma.buyerProfile.create({
        data: { userId: user.id, firstName: firstName || null, lastName: lastParts.join(' ') || null, phone: phone || null }
      });
      const tokens = await generateTokenPair(fastify, prisma, user);
      return reply.code(201).send({
        ok: true,
        ...tokens,
        user: { id: user.id, email: user.email, name: name || null, phone: phone || null, role: user.role }
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
    }
  });

  fastify.post('/logout', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ ok: true, message: 'Logged out successfully' });
  });

  fastify.get('/me', { preValidation: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.code(404).send({ ok: false, error: 'User not found' });
      const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
      return reply.send({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || null : null,
          phone: profile?.phone || null,
          role: user.role
        }
      });
    } catch (err) {
      return reply.code(500).send({ ok: false, error: 'Server error' });
    }
  });

  fastify.patch('/me', { preValidation: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { name, phone } = request.body as any;
      const [firstName, ...lastParts] = (name || '').split(' ');
      await prisma.buyerProfile.upsert({
        where: { userId },
        create: { userId, firstName: firstName || null, lastName: lastParts.join(' ') || null, phone: phone || null },
        update: { firstName: firstName || undefined, lastName: lastParts.join(' ') || undefined, phone: phone !== undefined ? phone : undefined }
      });
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
      return reply.send({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || null : null,
          phone: profile?.phone || null,
          role: user.role
        }
      });
    } catch (err) {
      return reply.code(500).send({ ok: false, error: 'Server error' });
    }
  });

  fastify.post('/change-password', { preValidation: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { currentPassword, newPassword } = request.body as any;
      if (!currentPassword || !newPassword) {
        return reply.code(400).send({ ok: false, error: 'Current and new password are required', code: 'MISSING_FIELDS' });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) return reply.code(401).send({ ok: false, error: 'Current password is incorrect', code: 'INVALID_PASSWORD' });
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
      return reply.send({ ok: true, message: 'Password changed successfully' });
    } catch (err) {
      return reply.code(500).send({ ok: false, error: 'Server error' });
    }
  });

  fastify.post('/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = request.body as any;
    if (!email) return reply.code(400).send({ ok: false, error: 'Email is required', code: 'MISSING_EMAIL' });
    return reply.send({ ok: true, message: 'If an account exists with this email, a reset link will be sent.' });
  });

  fastify.post('/push-token', { preValidation: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { token } = request.body as any;
      if (!token) {
        return reply.code(400).send({ ok: false, error: 'Push token is required' });
      }
      if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
        return reply.code(400).send({ ok: false, error: 'Invalid push token format' });
      }
      await prisma.buyerProfile.upsert({
        where: { userId },
        create: { userId, expoPushToken: token },
        update: { expoPushToken: token }
      });
      return reply.send({ ok: true, message: 'Push token registered' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ ok: false, error: 'Server error' });
    }
  });

  fastify.delete('/push-token', { preValidation: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      await prisma.buyerProfile.updateMany({
        where: { userId },
        data: { expoPushToken: null }
      });
      return reply.send({ ok: true, message: 'Push token removed' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ ok: false, error: 'Server error' });
    }
  });

  fastify.log.info('Mobile auth routes registered');
}
