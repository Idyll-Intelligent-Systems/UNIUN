class StripeMock {
  constructor() {}
  async checkout() { return { sessions: { create: async () => ({ url: 'https://example.com/checkout' }) } } }
}
module.exports = StripeMock
