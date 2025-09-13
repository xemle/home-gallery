import { TGalleryPluginManager, TPlugin } from "@home-gallery/types";

import { ExtensionRegistry } from "./extensionRegistry";

export function proxyRegisterForPlugin(manager: TGalleryPluginManager, registry: ExtensionRegistry, plugin: TPlugin) {
  return new Proxy(manager, {
    get(target, prop) {
      if (prop != 'register') {
        return Reflect.get(target, prop)
      }

      return async function(...args: any[]) {
        const [type, extension] = args
        // Always return a promise that catches sync and async errors
        return (async () => {
          return await registry.register(plugin, type, extension)
        })()
      }
    }
  })
}