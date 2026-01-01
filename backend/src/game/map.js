// Tile types
const TILE_GRASS = 0
const TILE_WATER = 1
const TILE_WALL = 2
const TILE_SAND = 3

function isWalkable(x, y) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return false
  const tile = map[y][x]
  return tile === TILE_GRASS || tile === TILE_SAND
}

module.exports = {
  TILE_GRASS,
  TILE_WATER,
  TILE_WALL,
  TILE_SAND,

  isWalkable
}
