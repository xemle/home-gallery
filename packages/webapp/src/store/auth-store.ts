import { create } from 'zustand';
import { eventBus } from '../api/ApiService';
import { AppConfig } from '../config/AppConfig';
import { toAbsoluteUrl } from '../utils/toAbsoluteUrl';
import { useConfigStore } from '../config/config-store';

export interface AuthUser {
  username: string
  roles: string[]
  webapp: Pick<AppConfig, 'disabled' | 'pages' | 'format'>
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
      const data = await res.json()
      const user: AuthUser = data.data
      // Update config to unauthorized user
      useConfigStore.getState().updateConfig(user.webapp || {})
      set(prev => ({ ...prev, currentUser: user, loginError: null, isLoggingIn: false }))


      eventBus.dispatch({type: 'user:login'})
      console.log('Logged in', user)
    } catch (e) {
      set(prev => ({ ...prev, loginError: 'Network error', isLoggingIn: false }))
    }
  },

  async logout() {
    const res = await fetch(toAbsoluteUrl('api/auth/logout'), { method: 'POST' })
    if (!res.ok) {
      throw new Error('Logout failed')
    }

    const data = await res.json()
    const user: AuthUser = data.data

    // Update config to unauthorized user
    useConfigStore.getState().updateConfig(user.webapp || {})
    set(prev => ({ ...prev, currentUser: null }))
    eventBus.dispatch({type: 'user:logout'})
    console.log('Logged out', user)
  },
}))
