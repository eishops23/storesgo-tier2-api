'use strict'

const bcrypt = require('bcryptjs')

async function authLoginRoute(fastify, options) {
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = request.body

      // Check if email and password provided
      if (!email || !password) {
        return reply.code(400).send({ message: 'Email and password are required' })
      }

      // Find user in DB
      const user = await fastify.prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return reply.code(400).send({ message: 'Invalid email or password' })
      }

      // Compare password
      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        return reply.code(400).send({ message: 'Invalid email or password' })
      }

      // Generate JWT token
      const token = fastify.jwt.sign({
        id: user.id,
        role: user.role,
        email: user.email
      })

      return reply.send({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    } catch (err) {
      fastify.log.error(err)
      return reply.code(500).send({ message: 'Something went wrong' })
    }
  })
}

module.exports = authLoginRoute
