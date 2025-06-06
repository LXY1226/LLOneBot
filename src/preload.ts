import { CheckVersion, Config } from './common/types'
import {
  CHANNEL_ERROR,
  CHANNEL_GET_CONFIG,
  CHANNEL_LOG,
  CHANNEL_CHECK_VERSION,
  CHANNEL_SELECT_FILE,
  CHANNEL_SET_CONFIG,
  CHANNEL_UPDATE,
} from './common/channels'
import { contextBridge, ipcRenderer } from 'electron'

const llonebot = {
  log: (data: unknown) => {
    ipcRenderer.send(CHANNEL_LOG, data)
  },
  checkVersion: async (): Promise<CheckVersion> => {
    return ipcRenderer.invoke(CHANNEL_CHECK_VERSION)
  },
  updateLLOneBot: async (): Promise<boolean> => {
    return ipcRenderer.invoke(CHANNEL_UPDATE)
  },
  setConfig: async (ask: boolean, config: Config) => {
    return ipcRenderer.invoke(CHANNEL_SET_CONFIG, ask, config)
  },
  getConfig: async (): Promise<Config> => {
    return ipcRenderer.invoke(CHANNEL_GET_CONFIG)
  },
  getError: async (): Promise<string> => {
    return ipcRenderer.invoke(CHANNEL_ERROR)
  },
  selectFile: (): Promise<string> => {
    return ipcRenderer.invoke(CHANNEL_SELECT_FILE)
  },
}

export type LLOneBot = typeof llonebot

// 在window对象下导出只读对象
contextBridge.exposeInMainWorld('llonebot', llonebot)
