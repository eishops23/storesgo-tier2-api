export default async function adminAuth(request, reply) {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return reply.status(401).send({ ok: false, error: "Missing token" });
    }

    // Use the JWT plugin to verify the token
    const decoded = request.server.jwt.verify(token);
    if (!decoded || !decoded.adminId) {
      return reply.status(401).send({ ok: false, error: "Invalid admin token" });
    }

    request.admin = decoded;
  } catch (err) {
    return reply.status(401).send({ ok: false, error: "Unauthorized" });
  }
}
