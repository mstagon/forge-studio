import type { ForgeApi } from './index'

declare global {
  interface Window {
    forgeApi: ForgeApi
  }
}
