import { create } from 'zustand'
import { toAbsoluteUrl } from '../utils/toAbsoluteUrl'

export interface AuthUser {
  username: string
  roles: string[]
  readOnly: boolean
}

interface AuthStore {
  authType: string
  currentUser: AuthUser | null
  loginError: string | null
  isLoggingIn: boolean

  init: (authType: string, currentUser: AuthUser | null) => void
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  authType: 'basic',
  currentUser: null,
  loginError: null,
  isLoggingIn: false,

  init(authType, currentUser) {
    set({ authType, currentUser })
  },

  async login(username, password) {
    set({ isLoggingIn: true, loginError: null })
    try {
      const res = await fetch(toAbsoluteUrl('api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        set({ loginError: data.error || 'Login failed', isLoggingIn: false })
        return
      }
      const user: AuthUser = await res.json()
      set({ currentUser: user, loginError: null, isLoggingIn: false })
    } catch (e) {
      set({ loginError: 'Network error', isLoggingIn: false })
    }
  },

  async logout() {
    await fetch(toAbsoluteUrl('api/auth/logout'), { method: 'POST' }).catch(() => {})
    set({ currentUser: null })
  },
}))
