const express = require('express')
const database = require('../config/database')
const authService = require('../services/authService')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName, starterPokemonId } = req.body

    // Validation
    if (!username || !password || !displayName || !starterPokemonId) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if username exists
    const existing = await database.get(
      'SELECT id FROM users WHERE username = ?',
      [username.toLowerCase()]
    )

    if (existing) {
      return res.status(409).json({ error: 'Username already taken' })
    }

    // Verify starter Pokemon exists and is a starter
    const pokemon = await database.get(
      'SELECT id FROM pokemon WHERE id = ? AND is_starter = 1',
      [starterPokemonId]
    )

    if (!pokemon) {
      return res.status(400).json({ error: 'Invalid starter Pokemon' })
    }

    // Hash password and create user
    const passwordHash = await authService.hashPassword(password)
    const result = await database.run(
      `INSERT INTO users (username, password_hash, display_name, starter_pokemon_id, last_login)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [username.toLowerCase(), passwordHash, displayName, starterPokemonId]
    )

    const userId = result.id

    // Create initial position
    await database.run(
      'INSERT INTO user_positions (user_id, x, y) VALUES (?, 0, 0)',
      [userId]
    )

    // Add starter Pokemon to user's collection
    await database.run(
      `INSERT INTO user_pokemon (user_id, pokemon_id, nickname, level, is_active)
       VALUES (?, ?, ?, 5, 1)`,
      [userId, starterPokemonId, displayName + "'s Pokemon"]
    )

    // Generate token
    const token = authService.generateToken({
      userId,
      username: username.toLowerCase(),
      displayName
    })

    res.status(201).json({
      token,
      user: {
        id: userId,
        username: username.toLowerCase(),
        displayName,
        starterPokemonId
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    // Find user
    const user = await database.get(
      'SELECT id, username, password_hash, display_name, starter_pokemon_id FROM users WHERE username = ?',
      [username.toLowerCase()]
    )

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const isValid = await authService.comparePassword(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Update last login
    await database.run(
      "UPDATE users SET last_login = datetime('now') WHERE id = ?",
      [user.id]
    )

    // Generate token
    const token = authService.generateToken({
      userId: user.id,
      username: user.username,
      displayName: user.display_name
    })

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        starterPokemonId: user.starter_pokemon_id
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await database.get(
      `SELECT u.id, u.username, u.display_name, u.starter_pokemon_id, u.created_at,
              up.x, up.y
       FROM users u
       LEFT JOIN user_positions up ON u.id = up.user_id
       WHERE u.id = ?`,
      [req.user.userId]
    )

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get active Pokemon
    const activePokemon = await database.get(
      `SELECT up.id, up.pokemon_id, up.nickname, up.level, up.experience,
              p.name, p.sprite_front
       FROM user_pokemon up
       JOIN pokemon p ON up.pokemon_id = p.id
       WHERE up.user_id = ? AND up.is_active = 1`,
      [user.id]
    )

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        starterPokemonId: user.starter_pokemon_id,
        position: { x: user.x, y: user.y },
        activePokemon
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user info' })
  }
})

module.exports = router
