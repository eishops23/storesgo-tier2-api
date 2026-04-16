'use strict'

module.exports = async function (fastify) {
  fastify.post('/logout', {
    preHandler: [fastify.authenticate], // only logged-in users can logout
    handler: async (request, reply) => {
      try {
        // In JWT-based auth, logout is usually client-side only
        // But you can optionally add logic here to blacklist token in DB or cache
        const user = request.user

        reply.send({
          message: 'Logout successful. Please remove your token from local storage.',
          user: { id: user.id, email: user.email, role: user.role }
        })
      } catch (err) {
        reply.code(500).send({ message: 'Logout failed', error: err.message })
      }
    }
  })
}
