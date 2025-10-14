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
        keys: ['esc'],
        action: 'list'
      },
      {
        keys: ['i'],
        action: 'toggleDetails',
        disabled: appConfig.pages?.mediaView?.disabled?.includes('detail')
      },
      {
        keys: ['a'],
        action: 'toggleAnnotations',
        disabled: appConfig.pages?.mediaView?.disabled?.includes('annotation')
      },
      {
        keys: ['s'],
        action: 'similar',
        disabled: appConfig.pages?.mediaView?.disabled?.includes('similar')
      },
      {
        keys: ['c'],
        action: 'chronology'
      },
      {
        keys: ['t'],
        action: 'toggleNavigation'
      },
      {
        keys: ['m'],
        action: 'map',
        disabled: appConfig.pages?.mediaView?.disabled?.includes('map')
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
