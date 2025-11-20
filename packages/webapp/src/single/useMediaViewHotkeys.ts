import { useMemo } from "react";
import { useAppConfig } from "../config/useAppConfig";

export type THotkeyAction = {
  keys: string[]
  action: string
  disabled?: boolean
}

export function useMediaViewHotkeys() {
  const appConfig = useAppConfig()

  const [hotkeys, hotkeysToAction] = useMemo(() => {
    const disabledFlags = appConfig.pages?.mediaView?.disabled ?? []

    const allHotkeys: THotkeyAction[] = [
      {
        keys: ['home'],
        action: 'first'
      },
      {
        keys: ['arrowleft', 'j', 'backspace'],
        action: 'prev'
      },
      {
        keys: ['ctrl+arrowleft'],
        action: 'prev-10'
      },
      {
        keys: ['ctrl+shift+arrowleft'],
        action: 'prev-100'
      },
      {
        keys: ['arrowright', 'k', 'space'],
        action: 'next'
      },
      {
        keys: ['ctrl+arrowright'],
        action: 'next-10'
      },
      {
        keys: ['ctrl+shift+arrowright'],
        action: 'next-100'
      },
      {
        keys: ['end'],
        action: 'last'
      },
      {
        keys: ['esc', 'escape'],
        action: 'list',
        disabled: disabledFlags.includes('nav')
      },
      {
        keys: ['i'],
        action: 'toggleDetails',
        disabled: disabledFlags.includes('detail')
      },
      {
        keys: ['a'],
        action: 'toggleAnnotations',
        disabled: disabledFlags.includes('annotation')
      },
      {
        keys: ['s'],
        action: 'similar',
        disabled: disabledFlags.includes('similar')
      },
      {
        keys: ['c'],
        action: 'chronology',
        disabled: disabledFlags.includes('nav')
      },
      {
        keys: ['t'],
        action: 'toggleNavigation'
      },
      {
        keys: ['m'],
        action: 'map',
        disabled: disabledFlags.includes('map')
      }
    ]
    const [keys, keyToAction] = allHotkeys.filter(hotkey => !hotkey.disabled).reduce(([keys, map], hotkey) => {
      hotkey.keys.forEach(key => {
        keys.push(key)
        map[key] = hotkey.action
      })
      return [keys, map]
    }, [[], {}] as [string[], Record<string, string>])

    return [keys, keyToAction]
  }, [appConfig])

  return [hotkeys, hotkeysToAction] as [string[], Record<string, string>]
}
