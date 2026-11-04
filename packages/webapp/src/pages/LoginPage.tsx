import * as React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as icons from "@fortawesome/free-solid-svg-icons";

export const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const { login, isLoggingIn, loginError, currentUser } = useAuthStore()

  useEffect(() => {
    if (currentUser) {
      window.location.replace('/')
    }
  }, [currentUser])

  const onSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    await login(username, password)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded p-8 w-full max-w-sm shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-gray-100 text-xl font-semibold">Sign in</h1>
          <button
              type="button"
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-100 hover:cursor-pointer p-4 -m-4"
              aria-label="Close"
          ><FontAwesomeIcon icon={icons.faXmark}/></button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:outline-none focus:border-gray-400"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isLoggingIn}
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:outline-none focus:border-gray-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoggingIn}
            />
          </div>
          {loginError && (
            <p className="text-red-400 text-sm">{loginError}</p>
          )}
          <button
            type="submit"
            disabled={isLoggingIn || !username || !password}
            className="mt-2 px-4 py-2 bg-gray-600 text-gray-100 rounded hover:bg-gray-500 active:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
