const axios = require('axios')
require('dotenv').config()

const POKEAPI_BASE_URL = process.env.POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2'

// Delay to respect rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

class PokeAPIService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: POKEAPI_BASE_URL,
      timeout: 10000
    })
  }

  async getAllPokemon(limit = 1000) {
    try {
      const response = await this.axiosInstance.get(`/pokemon?limit=${limit}`)
      return response.data.results
    } catch (error) {
      console.error('Error fetching Pokemon list:', error.message)
      throw error
    }
  }

  async getPokemonDetails(idOrName) {
    try {
      const response = await this.axiosInstance.get(`/pokemon/${idOrName}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching Pokemon ${idOrName}:`, error.message)
      throw error
    }
  }

  async getPokemonSpecies(id) {
    try {
      const response = await this.axiosInstance.get(`/pokemon-species/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching species ${id}:`, error.message)
      throw error
    }
  }

  async getEvolutionChain(url) {
    try {
      const response = await axios.get(url)
      return response.data
    } catch (error) {
      console.error('Error fetching evolution chain:', error.message)
      throw error
    }
  }

  extractPokemonData(pokemonData, speciesData) {
    return {
      id: pokemonData.id,
      name: pokemonData.name,
      sprite_front: pokemonData.sprites?.front_default || null,
      sprite_back: pokemonData.sprites?.back_default || null,
      height: pokemonData.height,
      weight: pokemonData.weight,
      base_experience: pokemonData.base_experience,
      is_baby: speciesData?.is_baby ? 1 : 0,
      is_starter: this.isStarter(pokemonData.id),
      pokeapi_data: JSON.stringify(pokemonData)
    }
  }

  extractTypes(pokemonData) {
    return pokemonData.types.map(type => ({
      pokemon_id: pokemonData.id,
      type_name: type.type.name,
      slot: type.slot
    }))
  }

  extractStats(pokemonData) {
    return pokemonData.stats.map(stat => ({
      pokemon_id: pokemonData.id,
      stat_name: stat.stat.name,
      base_stat: stat.base_stat
    }))
  }

  parseEvolutionChain(chain, evolutions = []) {
    if (!chain) return evolutions

    const currentId = this.extractIdFromUrl(chain.species.url)
    
    if (chain.evolves_to && chain.evolves_to.length > 0) {
      chain.evolves_to.forEach(evolution => {
        const evolvesToId = this.extractIdFromUrl(evolution.species.url)
        const evolutionDetail = evolution.evolution_details[0] || {}
        
        evolutions.push({
          pokemon_id: currentId,
          evolves_to_id: evolvesToId,
          min_level: evolutionDetail.min_level || null,
          trigger: evolutionDetail.trigger?.name || 'unknown'
        })

        // Recursively parse next evolutions
        this.parseEvolutionChain(evolution, evolutions)
      })
    }

    return evolutions
  }

  extractIdFromUrl(url) {
    const matches = url.match(/\/(\d+)\/$/)
    return matches ? parseInt(matches[1]) : null
  }

  isStarter(pokemonId) {
    // Classic starters from Gen 1-3
    const starters = [
      1, 4, 7,     // Gen 1: Bulbasaur, Charmander, Squirtle
      25,          // Pikachu
      152, 155, 158, // Gen 2: Chikorita, Cyndaquil, Totodile
      252, 255, 258, // Gen 3: Treecko, Torchic, Mudkip
      387, 390, 393  // Gen 4: Turtwig, Chimchar, Piplup
    ]
    return starters.includes(pokemonId) ? 1 : 0
  }
}

module.exports = new PokeAPIService()
