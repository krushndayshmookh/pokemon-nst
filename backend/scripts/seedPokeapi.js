const database = require('../src/config/database')
const pokeapiService = require('../src/services/pokeapiService')

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function seedPokemon() {
  try {
    console.log('🚀 Starting Pokemon data seeding...\n')

    // Connect to database
    await database.connect()
    await database.runMigrations()

    // Check if already seeded
    const existing = await database.get('SELECT COUNT(*) as count FROM pokemon')
    if (existing.count > 0) {
      console.log(`⚠️  Database already contains ${existing.count} Pokemon`)
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      const answer = await new Promise(resolve => {
        readline.question('Do you want to re-seed? This will clear existing data (y/N): ', resolve)
      })
      readline.close()

      if (answer.toLowerCase() !== 'y') {
        console.log('Seeding cancelled')
        await database.close()
        process.exit(0)
      }

      // Clear existing data
      await database.run('DELETE FROM evolutions')
      await database.run('DELETE FROM pokemon_stats')
      await database.run('DELETE FROM pokemon_types')
      await database.run('DELETE FROM pokemon')
      console.log('✅ Cleared existing data\n')
    }

    // Fetch Pokemon list
    console.log('📥 Fetching Pokemon list from PokeAPI...')
    const pokemonList = await pokeapiService.getAllPokemon(500) // Limit to 500 for initial setup
    console.log(`✅ Found ${pokemonList.length} Pokemon\n`)

    let processed = 0
    let failed = 0

    for (const pokemon of pokemonList) {
      try {
        const id = pokeapiService.extractIdFromUrl(pokemon.url)
        
        // Fetch detailed data
        const [pokemonData, speciesData] = await Promise.all([
          pokeapiService.getPokemonDetails(id),
          pokeapiService.getPokemonSpecies(id).catch(() => null) // Species data optional
        ])

        // Insert Pokemon
        const pokemonRow = pokeapiService.extractPokemonData(pokemonData, speciesData)
        await database.run(
          `INSERT INTO pokemon (id, name, sprite_front, sprite_back, height, weight, base_experience, is_baby, is_starter, pokeapi_data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pokemonRow.id,
            pokemonRow.name,
            pokemonRow.sprite_front,
            pokemonRow.sprite_back,
            pokemonRow.height,
            pokemonRow.weight,
            pokemonRow.base_experience,
            pokemonRow.is_baby,
            pokemonRow.is_starter,
            pokemonRow.pokeapi_data
          ]
        )

        // Insert types
        const types = pokeapiService.extractTypes(pokemonData)
        for (const type of types) {
          await database.run(
            'INSERT INTO pokemon_types (pokemon_id, type_name, slot) VALUES (?, ?, ?)',
            [type.pokemon_id, type.type_name, type.slot]
          )
        }

        // Insert stats
        const stats = pokeapiService.extractStats(pokemonData)
        for (const stat of stats) {
          await database.run(
            'INSERT INTO pokemon_stats (pokemon_id, stat_name, base_stat) VALUES (?, ?, ?)',
            [stat.pokemon_id, stat.stat_name, stat.base_stat]
          )
        }

        // Fetch and insert evolution data
        if (speciesData?.evolution_chain?.url) {
          try {
            const evolutionChain = await pokeapiService.getEvolutionChain(speciesData.evolution_chain.url)
            const evolutions = pokeapiService.parseEvolutionChain(evolutionChain.chain)
            
            for (const evolution of evolutions) {
              await database.run(
                'INSERT OR IGNORE INTO evolutions (pokemon_id, evolves_to_id, min_level, trigger) VALUES (?, ?, ?, ?)',
                [evolution.pokemon_id, evolution.evolves_to_id, evolution.min_level, evolution.trigger]
              )
            }
          } catch (err) {
            // Evolution data optional
          }
        }

        processed++
        if (processed % 10 === 0) {
          console.log(`📦 Processed ${processed}/${pokemonList.length} Pokemon...`)
        }

        // Respect rate limits (100 requests/minute)
        await delay(600) // ~600ms between requests

      } catch (error) {
        console.error(`❌ Failed to process ${pokemon.name}:`, error.message)
        failed++
      }
    }

    console.log(`\n✅ Seeding complete!`)
    console.log(`   - Successfully processed: ${processed}`)
    console.log(`   - Failed: ${failed}`)

    // Show stats
    const counts = await database.all(`
      SELECT 
        (SELECT COUNT(*) FROM pokemon) as total_pokemon,
        (SELECT COUNT(*) FROM pokemon WHERE is_starter = 1) as starters,
        (SELECT COUNT(*) FROM pokemon WHERE is_baby = 1) as babies,
        (SELECT COUNT(*) FROM pokemon_types) as types,
        (SELECT COUNT(*) FROM pokemon_stats) as stats,
        (SELECT COUNT(*) FROM evolutions) as evolutions
    `)
    
    console.log('\n📊 Database Statistics:')
    console.log(`   - Total Pokemon: ${counts[0].total_pokemon}`)
    console.log(`   - Starters: ${counts[0].starters}`)
    console.log(`   - Babies: ${counts[0].babies}`)
    console.log(`   - Type records: ${counts[0].types}`)
    console.log(`   - Stat records: ${counts[0].stats}`)
    console.log(`   - Evolution records: ${counts[0].evolutions}`)

    await database.close()
    console.log('\n🎉 Done!')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    await database.close()
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  seedPokemon()
}

module.exports = seedPokemon
