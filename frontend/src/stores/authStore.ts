import { create } from 'zustand'
import api from '../lib/api'
import { wsManager } from '../lib/websocket'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  googleLogin: (googleToken: string) => Promise<void>
  logout: () => void
  loadUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, user } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token: access_token, isAuthenticated: true })
    wsManager.connect(access_token)
  },

  register: async (email, password, fullName) => {
    const res = await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
    })
    const { access_token, user } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token: access_token, isAuthenticated: true })
    wsManager.connect(access_token)
  },

  googleLogin: async (googleToken) => {
    const res = await api.post('/auth/google', { token: googleToken })
    const { access_token, user } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token: access_token, isAuthenticated: true })
    wsManager.connect(access_token)
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    wsManager.disconnect()
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadUser: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      const user = JSON.parse(userStr)
      set({ user, token, isAuthenticated: true, isLoading: false })
      wsManager.connect(token)
    } else {
      set({ isLoading: false })
    }
  },
}))
