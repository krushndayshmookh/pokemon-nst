const { makeNoise2D } = require('fast-simplex-noise')
const { TILE_GRASS, TILE_WATER, TILE_WALL, TILE_SAND } = require('./map')

// Configuration
const CHUNK_SIZE = 16 // 16x16 tiles per chunk
const SEED = 12345 // Fixed seed for now, could be random

// Simple seeded random number generator (Park-Miller LCG)
function createRandom(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Helper to create a noise function with octaves
function createNoiseGenerator({ frequency, octaves, seed }) {
  const rand = createRandom(seed)
  const noise2D = makeNoise2D(rand)

  return {
    get: (x, y) => {
      let amplitude = 1
      let freq = frequency
      let value = 0
      let max = 0

      for (let i = 0; i < octaves; i++) {
        value += noise2D(x * freq, y * freq) * amplitude
        max += amplitude
        amplitude *= 0.5
        freq *= 2
      }
      // Normalize to 0..1 (assuming noise2D returns -1..1)
      return (value / max + 1) / 2
    },
  }
}
// Noise generators
const elevationGen = createNoiseGenerator({
  frequency: 0.05,
  octaves: 4,
  seed: SEED,
})
const moistureGen = createNoiseGenerator({
  frequency: 0.03,
  octaves: 2,
  seed: SEED + 1,
})

/**
 * Generate a chunk of tiles at the given chunk coordinates (cx, cy)
 * @param {number} cx Chunk X coordinate
 * @param {number} cy Chunk Y coordinate
 * @returns {number[][]} 2D array of tile types
 */
function generateChunk(cx, cy) {
  const chunk = []

  for (let y = 0; y < CHUNK_SIZE; y++) {
    const row = []
    const worldY = cy * CHUNK_SIZE + y

    for (let x = 0; x < CHUNK_SIZE; x++) {
      const worldX = cx * CHUNK_SIZE + x

      // Get noise values
      const elevation = elevationGen.get(worldX, worldY)
      const moisture = moistureGen.get(worldX, worldY)

      let tile = TILE_GRASS

      // Determine tile type based on elevation and moisture
      if (elevation < 0.3) {
        tile = TILE_WATER // Deep water / Ocean
      } else if (elevation < 0.35) {
        tile = TILE_SAND // Beach
      } else if (elevation > 0.8) {
        tile = TILE_WALL // Mountain / Wall
      } else {
        // Grass variations based on moisture could go here
        tile = TILE_GRASS
      }

      row.push(tile)
    }
    chunk.push(row)
  }

  return chunk
}

/**
 * Get a unique key for a chunk
 */
function getChunkKey(cx, cy) {
  return `${cx},${cy}`
}

module.exports = {
  generateChunk,
  getChunkKey,
  CHUNK_SIZE,
}
