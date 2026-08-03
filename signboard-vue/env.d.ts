/// <reference types="vite/client" />

declare module '@vendor/*'

import type { BoardBridge, ChooserBridge, ElectronApiBridge } from './src/types'

declare global {
  interface Window {
    board: BoardBridge
    chooser: ChooserBridge
    electronAPI: ElectronApiBridge
    FDatepicker?: any
    Sortable?: any
  }
}

export {}
