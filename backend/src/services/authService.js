const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const SALT_ROUNDS = 12
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me'
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d'

class AuthService {
  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS)
  }

  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash)
  }

  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION })
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }
}

module.exports = new AuthService()
