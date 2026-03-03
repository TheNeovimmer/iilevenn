'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from './api'

interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ACCESS_TOKEN_KEY = 'iileven_access_token'
const REFRESH_TOKEN_KEY = 'iileven_refresh_token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
  })

  const setAuth = useCallback((user: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    setState({ user, accessToken, isLoading: false })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    setState({ user: null, accessToken: null, isLoading: false })
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      )
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Login failed')
      }
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
    },
    [setAuth],
  )

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await api<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify({ email, password, name }) },
      )
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Registration failed')
      }
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
    },
    [setAuth],
  )

  // Restore session on mount
  useEffect(() => {
    async function restore() {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

      if (!accessToken) {
        setState((s) => ({ ...s, isLoading: false }))
        return
      }

      // Try /auth/me with current access token
      const meRes = await api<{ user: User }>('/auth/me', { token: accessToken })
      if (meRes.success && meRes.data) {
        setState({ user: meRes.data.user, accessToken, isLoading: false })
        return
      }

      if (refreshToken) {
        const refreshRes = await api<{ accessToken: string; refreshToken: string }>(
          '/auth/refresh',
          { method: 'POST', body: JSON.stringify({ refreshToken }) },
        )

        if (refreshRes.success && refreshRes.data) {
          localStorage.setItem(ACCESS_TOKEN_KEY, refreshRes.data.accessToken)
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshRes.data.refreshToken)

          const retryMe = await api<{ user: User }>('/auth/me', {
            token: refreshRes.data.accessToken,
          })

          if (retryMe.success && retryMe.data) {
            setState({
              user: retryMe.data.user,
              accessToken: refreshRes.data.accessToken,
              isLoading: false,
            })
            return
          }
        }
      }

      // All failed — clear and logout
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      setState({ user: null, accessToken: null, isLoading: false })
    }

    restore()
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
