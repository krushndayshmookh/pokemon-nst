// Map dimensions
const WIDTH = 20
const HEIGHT = 15

// Tile types
const TILE_GRASS = 0
const TILE_WATER = 1
const TILE_WALL = 2
const TILE_SAND = 3

// Generate a simple map with some features
const map = Array(HEIGHT).fill().map(() => Array(WIDTH).fill(TILE_GRASS))

// Add a lake
for (let y = 3; y < 8; y++) {
  for (let x = 3; x < 8; x++) {
    map[y][x] = TILE_WATER
  }
}

// Add some walls
for (let y = 0; y < HEIGHT; y++) {
  map[y][0] = TILE_WALL
  map[y][WIDTH - 1] = TILE_WALL
}
for (let x = 0; x < WIDTH; x++) {
  map[0][x] = TILE_WALL
  map[HEIGHT - 1][x] = TILE_WALL
}

// Add a sand path
for (let y = 8; y < HEIGHT - 1; y++) {
  map[y][10] = TILE_SAND
  map[y][11] = TILE_SAND
}

function isWalkable(x, y) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return false
  const tile = map[y][x]
  return tile === TILE_GRASS || tile === TILE_SAND
}

module.exports = {
  map,
  WIDTH,
  HEIGHT,
  TILE_GRASS,
  TILE_WATER,
  TILE_WALL,
  TILE_SAND,
  isWalkable
}
