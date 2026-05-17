import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import * as icons from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuthStore } from '../store/auth-store'

export const LoginButton = () => {
  const {showLogin, currentUser, logout} = useAuthStore()
  const navigate = useNavigate()
  if (!showLogin) {
    return null
  }
  const classes = 'flex px-2 py-2 rounded shadow text-gray-500 hover:bg-gray-700 hover:text-gray-300 hover:cursor-pointer active:bg-gray-600 active:text-gray-200'
  if (currentUser) {
    return (
      <a className={classes}
        onClick={() => logout().then(() => navigate('/'))}
        title='Logout'>
        <FontAwesomeIcon icon={icons.faRightFromBracket} />
      </a>
    )
  } else {
    return (
      <a className={classes}
        onClick={() => navigate('/login')}
        title='Login'>
        <FontAwesomeIcon icon={icons.faUser} />
      </a>
    )
  }
}
