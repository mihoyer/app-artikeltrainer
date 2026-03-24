import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL: BASE })

// Anonymen Nutzer-Token aus localStorage holen oder neu anlegen
export async function initUser() {
  const stored = localStorage.getItem('at_token')
  const res = await api.post('/api/user/init', { token: stored || null })
  localStorage.setItem('at_token', res.data.token)
  return res.data
}

export function getToken() {
  return localStorage.getItem('at_token')
}

export async function getCategories() {
  const res = await api.get('/api/categories')
  return res.data
}

export async function getNextExercise(categorySlug = null) {
  const token = getToken()
  const res = await api.post('/api/exercise/next', {
    token,
    category_slug: categorySlug
  })
  return res.data
}

export async function submitAnswer(exerciseId, userAnswer) {
  const token = getToken()
  const res = await api.post('/api/exercise/answer', {
    token,
    exercise_id: exerciseId,
    user_answer: userAnswer
  })
  return res.data
}

export async function getUserStats() {
  const token = getToken()
  if (!token) return null
  const res = await api.get(`/api/user/stats/${token}`)
  return res.data
}
