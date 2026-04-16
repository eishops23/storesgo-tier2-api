'use strict'

const bcrypt = require('bcryptjs')

module.exports = async function (fastify) {
  fastify.post('/register', async (request, reply) => {
    const { name, email, password, role } = request.body

    // Check if user already exists
    const existingUser = await fastify.prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return reply.code(400).send({ message: 'Email already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await fastify.prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword, 
        role: role || 'CUSTOMER' 
      }
    })

    // Generate JWT token
    const token = fastify.jwt.sign({ id: user.id, role: user.role })

    // Respond with token and user data
    reply.send({ token, user })
  })
}
