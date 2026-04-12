import { create } from 'zustand'
import { toAbsoluteUrl } from '../utils/toAbsoluteUrl'
import { deleteOfflineRoot } from '../offline'

export interface AuthUser {
  username: string
  roles: string[]
  readOnly: boolean
}

interface AuthStore {
  allowPublic: boolean
  readOnly: boolean
  currentUser: AuthUser | null
  loginError: string | null
  isLoggingIn: boolean

  init: (allowPublic: boolean, currentUser: AuthUser | null, readOnly: boolean) => void
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  allowPublic: false,
  readOnly: false,
  currentUser: null,
  loginError: null,
  isLoggingIn: false,

  init(allowPublic, currentUser, readOnly) {
    set({ allowPublic, currentUser, readOnly })
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
    await deleteOfflineRoot()
    await fetch(toAbsoluteUrl('api/auth/logout'), { method: 'POST' }).catch(() => {})
    set({ currentUser: null })
  },
}))
