import { create } from 'zustand';
import { eventBus } from '../api/ApiService';
import { toAbsoluteUrl } from '../utils/toAbsoluteUrl';

export interface AuthUser {
  username: string
  roles: string[]
}

interface AuthStore {
  showLogin: boolean
  currentUser: AuthUser | null
  loginError: string | null
  isLoggingIn: boolean

  init: (showLogin: boolean, currentUser: AuthUser | null) => void
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  showLogin: false,
  currentUser: null,
  loginError: null,
  isLoggingIn: false,

  init(showLogin, currentUser) {
    set(prev => ({ ...prev, showLogin, currentUser }))
  },

  async login(username, password) {
    set(prev => ({ ...prev, isLoggingIn: true, loginError: null }))
    try {
      const res = await fetch(toAbsoluteUrl('api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        set(prev => ({ ...prev, loginError: data.error || 'Login failed', isLoggingIn: false }))
        return
      }
      const user: AuthUser = await res.json()
      set(prev => ({ ...prev, currentUser: user, loginError: null, isLoggingIn: false }))

      eventBus.dispatch({type: 'user:login'})
    } catch (e) {
      set(prev => ({ ...prev, loginError: 'Network error', isLoggingIn: false }))
    }
  },

  async logout() {
    await fetch(toAbsoluteUrl('api/auth/logout'), { method: 'POST' }).catch(() => {})
    set(prev => ({ ...prev, currentUser: null }))
    eventBus.dispatch({type: 'user:logout'})
  },
}))
