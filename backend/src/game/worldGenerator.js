const { makeNoise2D } = require('fast-simplex-noise')
const { TILE_GRASS, TILE_WATER, TILE_WALL, TILE_SAND } = require('./map')

// Configuration
const CHUNK_SIZE = 16 // 16x16 tiles per chunk
const SEED = 12345 // Fixed seed for consistent world across all clients

// Create noise generators once at module load
// These are stateless and deterministic - same input always gives same output
const elevationNoise = makeNoise2D(() => 0.5) // Using constant seed for deterministic behavior
const moistureNoise = makeNoise2D(() => 0.7) // Different constant for moisture

// Hash function for deterministic noise based on coordinates
function hash(x, y, seed) {
  let h = seed
  h = ((h << 5) - h + x) | 0
  h = ((h << 5) - h + y) | 0
  return h
}

// Get noise value with proper seeding for determinism
function getNoise(noiseFunc, x, y, frequency, octaves, seed) {
  let amplitude = 1
  let freq = frequency
  let value = 0
  let max = 0

  for (let i = 0; i < octaves; i++) {
    // Add seed offset to ensure deterministic results
    const offsetX = hash(seed + i, 0, seed) / 2147483647
    const offsetY = hash(seed + i, 1, seed) / 2147483647
    
    value += noiseFunc((x + offsetX) * freq, (y + offsetY) * freq) * amplitude
    max += amplitude
    amplitude *= 0.5
    freq *= 2
  }
  
  // Normalize to 0..1 (noise2D returns -1..1)
  return (value / max + 1) / 2
}

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

      // Get noise values - now deterministic!
      const elevation = getNoise(elevationNoise, worldX, worldY, 0.05, 4, SEED)
      const moisture = getNoise(moistureNoise, worldX, worldY, 0.03, 2, SEED + 1000)

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
