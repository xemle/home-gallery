import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import * as icons from '@fortawesome/free-solid-svg-icons'
import { NavItem } from './NavItem'
import { useAuthStore } from '../store/auth-store'

export const LoginButton = () => {
  const { authType, currentUser, logout } = useAuthStore()
  const navigate = useNavigate()

  if (authType !== 'cookie') {
    return null
  }

  if (currentUser) {
    return (
      <NavItem
        icon={icons.faRightFromBracket}
        text={currentUser.username}
        onClick={() => logout().then(() => navigate('/', { replace: true }))}
      />
    )
  }

  return (
    <NavItem
      icon={icons.faRightToBracket}
      text={'Login'}
      onClick={() => navigate('/login')}
    />
  )
}
