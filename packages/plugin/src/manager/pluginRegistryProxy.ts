import { TGalleryPluginManager, TPlugin } from "@home-gallery/types";

import { ExtensionRegistry } from "./extensionRegistry";

export function proxyRegisterForPlugin(manager: TGalleryPluginManager, registry: ExtensionRegistry, plugin: TPlugin) {
  return new Proxy(manager, {
    get(target, prop) {
      if (prop != 'register') {
        return Reflect.get(target, prop)
      }

      return new Proxy(target[prop], {
        apply(_target, _thisArg, args) {
          const [type, extension] = args
          return registry.register(plugin, type, extension)
        }
      })
    }
  })
}