<template>
  <div class="auth-container">
    <div class="auth-card" :class="{ wide: step === 2 }">
      <h1>Pokemon NST</h1>
      <h2>{{ step === 1 ? 'Create Account' : 'Choose Your Starter' }}</h2>

      <!-- Step 1: Account Details -->
      <form v-if="step === 1" @submit.prevent="goToStep2">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="Choose a username (3-20 chars)"
            required
            minlength="3"
            maxlength="20"
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="displayName">Display Name</label>
          <input
            id="displayName"
            v-model="form.displayName"
            type="text"
            placeholder="Your display name"
            required
            maxlength="30"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="At least 6 characters"
            required
            minlength="6"
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            placeholder="Re-enter password"
            required
            autocomplete="new-password"
          />
        </div>

        <div v-if="validationError" class="error-message">
          {{ validationError }}
        </div>

        <button type="submit" class="btn-primary">
          Next: Choose Starter
        </button>
      </form>

      <!-- Step 2: Starter Selection -->
      <div v-if="step === 2" class="starter-selection">
        <div v-if="loadingStarters" class="loading">
          Loading Pokemon...
        </div>

        <div v-else class="starters-grid">
          <div
            v-for="starter in starters"
            :key="starter.id"
            class="starter-card"
            :class="{ selected: form.starterPokemonId === starter.id }"
            @click="form.starterPokemonId = starter.id"
          >
            <img :src="starter.sprite_front" :alt="starter.name" />
            <h3>{{ capitalize(starter.name) }}</h3>
            <div class="types">
              <span
                v-for="type in starter.types"
                :key="type"
                class="type-badge"
                :class="`type-${type}`"
              >
                {{ type }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <div class="button-group">
          <button type="button" @click="step = 1" class="btn-secondary">
            Back
          </button>
          <button
            type="button"
            @click="handleRegister"
            :disabled="!form.starterPokemonId || authStore.loading"
            class="btn-primary"
          >
            {{ authStore.loading ? 'Creating...' : 'Start Adventure' }}
          </button>
        </div>
      </div>

      <p v-if="step === 1" class="auth-link">
        Already have an account?
        <router-link to="/login">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { pokemonAPI } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const step = ref(1)
const starters = ref([])
const loadingStarters = ref(false)
const validationError = ref('')

const form = reactive({
  username: '',
  displayName: '',
  password: '',
  confirmPassword: '',
  starterPokemonId: null
})

function goToStep2() {
  validationError.value = ''

  if (form.password !== form.confirmPassword) {
    validationError.value = 'Passwords do not match'
    return
  }

  if (form.password.length < 6) {
    validationError.value = 'Password must be at least 6 characters'
    return
  }

  step.value = 2
  if (starters.value.length === 0) {
    loadStarters()
  }
}

async function loadStarters() {
  loadingStarters.value = true
  try {
    const response = await pokemonAPI.getStarters()
    starters.value = response.data
  } catch (error) {
    console.error('Failed to load starters:', error)
    validationError.value = 'Failed to load Pokemon. Please try again.'
    step.value = 1
  } finally {
    loadingStarters.value = false
  }
}

async function handleRegister() {
  try {
    await authStore.register(
      form.username,
      form.password,
      form.displayName,
      form.starterPokemonId
    )
    router.push('/game')
  } catch (error) {
    // Error is handled by store
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  transition: max-width 0.3s;
}

.auth-card.wide {
  max-width: 800px;
}

h1 {
  font-size: 2rem;
  margin: 0 0 10px;
  color: #333;
  text-align: center;
}

h2 {
  font-size: 1.5rem;
  margin: 0 0 30px;
  color: #666;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e8ed;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

.starters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.starter-card {
  background: #f8f9fa;
  border: 3px solid transparent;
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.starter-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.starter-card.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.starter-card img {
  width: 96px;
  height: 96px;
  image-rendering: pixelated;
}

.starter-card h3 {
  margin: 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.types {
  display: flex;
  gap: 5px;
  justify-content: center;
  flex-wrap: wrap;
}

.type-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
}

.type-fire { background: #f08030; }
.type-water { background: #6890f0; }
.type-grass { background: #78c850; }
.type-electric { background: #f8d030; color: #333; }
.type-normal { background: #a8a878; }
.type-fighting { background: #c03028; }
.type-flying { background: #a890f0; }
.type-poison { background: #a040a0; }
.type-ground { background: #e0c068; }
.type-rock { background: #b8a038; }
.type-bug { background: #a8b820; }
.type-ghost { background: #705898; }
.type-steel { background: #b8b8d0; }
.type-psychic { background: #f85888; }
.type-ice { background: #98d8d8; }
.type-dragon { background: #7038f8; }
.type-dark { background: #705848; }
.type-fairy { background: #ee99ac; }

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.button-group {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e1e8ed;
  color: #555;
}

.btn-secondary:hover {
  background: #d1d8dd;
}

.auth-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.auth-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.auth-link a:hover {
  text-decoration: underline;
}
</style>
