import { useConfigStore } from "./config-store";

export const useAppConfig = () => useConfigStore(state => state.config)
