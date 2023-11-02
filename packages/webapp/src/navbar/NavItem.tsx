import * as React from "react"
import { MouseEventHandler } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/free-solid-svg-icons'

import { classNames } from '../utils/class-names'

type NavItemProps = {
  onClick: MouseEventHandler
  icon: IconDefinition
  text?: string
  smText?: string
  disabled?: boolean
}

export const NavItem = ({onClick, icon, text, smText, disabled}: NavItemProps) => {
  return (
    <a className={classNames(
      'flex gap-2 items-center justify-center px-2 py-2 rounded shadow  ', {
        'text-gray-500 hover:bg-gray-700 hover:text-gray-300 hover:cursor-pointer active:bg-gray-600 active:text-gray-200': !disabled,
        'text-gray-700 -outline-offset-1 border border-transparent hover:border-gray-600 hover:cursor-not-allowed': disabled})}
      onClick={onClick}>
      <FontAwesomeIcon icon={icon} />
      <span className="max-md:hidden whitespace-nowrap">{text}</span>
      {smText && (
        <span className="md:hidden">{smText}</span>
      )}
    </a>
  )
}