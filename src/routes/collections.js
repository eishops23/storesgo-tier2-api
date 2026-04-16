'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/collections', async (request, reply) => {
    return {
      success: true,
      message: 'Collections route is working!',
      data: [
        { id: 1, name: 'Fruits & Vegetables' },
        { id: 2, name: 'Snacks & Beverages' },
        { id: 3, name: 'Ethnic Essentials' }
      ]
    }
  })
}
