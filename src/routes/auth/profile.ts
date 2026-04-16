import { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import { authenticateUser } from "../../middleware/authUser.js";

const profileRoutes: FastifyPluginAsync = async (app) => {
  // Update profile
  app.put("/profile", {
    preHandler: [authenticateUser],
  }, async (request, reply) => {
    const { firstName, lastName, phone } = request.body as any;
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.code(401).send({ ok: false, error: "Unauthorized" });
    }

    try {
      // Upsert buyer profile (create if not exists, update if exists)
      const buyerProfile = await app.prisma.buyerProfile.upsert({
        where: { userId },
        create: {
          userId,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
        },
        update: {
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
        },
      });

      // Get user email for response
      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true },
      });

      return {
        ok: true,
        user: {
          id: user?.id,
          email: user?.email,
          role: user?.role,
          firstName: buyerProfile.firstName,
          lastName: buyerProfile.lastName,
          name: buyerProfile.firstName && buyerProfile.lastName 
            ? `${buyerProfile.firstName} ${buyerProfile.lastName}` 
            : buyerProfile.firstName || null,
          phone: buyerProfile.phone,
        },
      };
    } catch (error: any) {
      console.error("Profile update error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to update profile" });
    }
  });

  // Change password
  app.put("/change-password", {
    preHandler: [authenticateUser],
  }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body as any;
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.code(401).send({ ok: false, error: "Unauthorized" });
    }
    if (!currentPassword || !newPassword) {
      return reply.code(400).send({ ok: false, error: "Current and new password required" });
    }
    if (newPassword.length < 8) {
      return reply.code(400).send({ ok: false, error: "Password must be at least 8 characters" });
    }

    try {
      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user || !user.password) {
        return reply.code(401).send({ ok: false, error: "User not found" });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return reply.code(401).send({ ok: false, error: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await app.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return { ok: true, message: "Password changed successfully" };
    } catch (error: any) {
      console.error("Password change error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to change password" });
    }
  });
};

export default profileRoutes;
