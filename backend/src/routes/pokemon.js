const express = require('express')
const database = require('../config/database')

const router = express.Router()

// Get all starter Pokemon
router.get('/starters', async (req, res) => {
  try {
    const starters = await database.all(
      `SELECT p.id, p.name, p.sprite_front, p.height, p.weight,
              GROUP_CONCAT(pt.type_name) as types
       FROM pokemon p
       LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
       WHERE p.is_starter = 1
       GROUP BY p.id
       ORDER BY p.id`
    )

    // Format types as array
    const formatted = starters.map(p => ({
      ...p,
      types: p.types ? p.types.split(',') : []
    }))

    res.json(formatted)
  } catch (error) {
    console.error('Get starters error:', error)
    res.status(500).json({ error: 'Failed to fetch starters' })
  }
})

// Get Pokemon by ID
router.get('/:id', async (req, res) => {
  try {
    const pokemon = await database.get(
      'SELECT * FROM pokemon WHERE id = ?',
      [req.params.id]
    )

    if (!pokemon) {
      return res.status(404).json({ error: 'Pokemon not found' })
    }

    // Get types
    const types = await database.all(
      'SELECT type_name FROM pokemon_types WHERE pokemon_id = ? ORDER BY slot',
      [pokemon.id]
    )

    // Get stats
    const stats = await database.all(
      'SELECT stat_name, base_stat FROM pokemon_stats WHERE pokemon_id = ?',
      [pokemon.id]
    )

    // Get evolutions
    const evolutions = await database.all(
      'SELECT evolves_to_id, min_level, trigger FROM evolutions WHERE pokemon_id = ?',
      [pokemon.id]
    )

    res.json({
      ...pokemon,
      types: types.map(t => t.type_name),
      stats: stats.reduce((acc, s) => {
        acc[s.stat_name] = s.base_stat
        return acc
      }, {}),
      evolutions
    })
  } catch (error) {
    console.error('Get Pokemon error:', error)
    res.status(500).json({ error: 'Failed to fetch Pokemon' })
  }
})

module.exports = router
