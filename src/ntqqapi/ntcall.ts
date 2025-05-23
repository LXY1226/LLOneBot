import { ipcMain } from 'electron'
import { hookApiCallbacks, registerReceiveHook, removeReceiveHook } from './hook'
import { DetailedError, getBuildVersion, log } from '../common/utils'
import { randomUUID } from 'node:crypto'
import {
  GeneralCallResult,
  NodeIKernelBuddyService,
  NodeIKernelProfileService,
  NodeIKernelGroupService,
  NodeIKernelProfileLikeService,
  NodeIKernelMsgService,
  NodeIKernelMSFService,
  NodeIKernelUixConvertService,
  NodeIKernelRichMediaService,
  NodeIKernelTicketService,
  NodeIKernelTipOffService,
  NodeIKernelRobotService,
  NodeIKernelNodeMiscService,
  NodeIKernelRecentContactService,
} from './services'

export enum NTClass {
  NT_API = 'ns-ntApi',
  FS_API = 'ns-FsApi',
  OS_API = 'ns-OsApi',
  HOTUPDATE_API = 'ns-HotUpdateApi',
  BUSINESS_API = 'ns-BusinessApi',
  NODE_STORE_API = 'ns-NodeStoreApi',
  QQ_EX_API = 'ns-QQEXApi',
}

const newEventName: Record<NTClass, string> = {
  [NTClass.NT_API]: 'ntApi',
  [NTClass.FS_API]: 'FileApi',
  [NTClass.OS_API]: 'OsApi',
  [NTClass.HOTUPDATE_API]: 'HotUpdateApi',
  [NTClass.BUSINESS_API]: 'BusinessApi',
  [NTClass.NODE_STORE_API]: 'NodeStoreApi',
  [NTClass.QQ_EX_API]: 'QQEXApi'
}

export enum NTMethod {
  ACTIVE_CHAT_PREVIEW = 'nodeIKernelMsgService/getAioFirstViewLatestMsgsAndAddActiveChat', // 激活聊天窗口，有时候必须这样才能收到消息, 并返回最新预览消息
  ACTIVE_CHAT_HISTORY = 'nodeIKernelMsgService/getMsgsIncludeSelfAndAddActiveChat', // 激活聊天窗口，有时候必须这样才能收到消息, 并返回历史消息
  HISTORY_MSG = 'nodeIKernelMsgService/getMsgsIncludeSelf',
  GET_MULTI_MSG = 'nodeIKernelMsgService/getMultiMsg',
  DELETE_ACTIVE_CHAT = 'nodeIKernelMsgService/deleteActiveChatByUid',
  MEDIA_FILE_PATH = 'nodeIKernelMsgService/getRichMediaFilePathForGuild',
  RECALL_MSG = 'nodeIKernelMsgService/recallMsg',
  EMOJI_LIKE = 'nodeIKernelMsgService/setMsgEmojiLikes',

  SELF_INFO = 'fetchAuthData',
  FILE_TYPE = 'getFileType',
  FILE_MD5 = 'getFileMd5',
  FILE_COPY = 'copyFile',
  IMAGE_SIZE = 'getImageSizeFromPath',
  FILE_SIZE = 'getFileSize',
  CACHE_PATH_HOT_UPDATE = 'getHotUpdateCachePath',
  CACHE_PATH_DESKTOP_TEMP = 'getDesktopTmpPath',
  CACHE_PATH_SESSION = 'getCleanableAppSessionPathList',
  OPEN_EXTRA_WINDOW = 'openExternalWindow',

  GROUP_MEMBER_SCENE = 'nodeIKernelGroupService/createMemberListScene',
  GROUP_MEMBERS = 'nodeIKernelGroupService/getNextMemberList',
  HANDLE_GROUP_REQUEST = 'nodeIKernelGroupService/operateSysNotify',
  QUIT_GROUP = 'nodeIKernelGroupService/quitGroup',
  GROUP_AT_ALL_REMAIN_COUNT = 'nodeIKernelGroupService/getGroupRemainAtTimes',
  KICK_MEMBER = 'nodeIKernelGroupService/kickMember',
  MUTE_MEMBER = 'nodeIKernelGroupService/setMemberShutUp',
  MUTE_GROUP = 'nodeIKernelGroupService/setGroupShutUp',
  SET_MEMBER_CARD = 'nodeIKernelGroupService/modifyMemberCardName',
  SET_MEMBER_ROLE = 'nodeIKernelGroupService/modifyMemberRole',
  SET_GROUP_NAME = 'nodeIKernelGroupService/modifyGroupName',

  HANDLE_FRIEND_REQUEST = 'nodeIKernelBuddyService/approvalFriendRequest',

  CACHE_SET_SILENCE = 'nodeIKernelStorageCleanService/setSilentScan',
  CACHE_ADD_SCANNED_PATH = 'nodeIKernelStorageCleanService/addCacheScanedPaths',
  CACHE_SCAN = 'nodeIKernelStorageCleanService/scanCache',
  CACHE_CLEAR = 'nodeIKernelStorageCleanService/clearCacheDataByKeys',
  CACHE_CHAT_GET = 'nodeIKernelStorageCleanService/getChatCacheInfo',
  CACHE_FILE_GET = 'nodeIKernelStorageCleanService/getFileCacheInfo',
  CACHE_CHAT_CLEAR = 'nodeIKernelStorageCleanService/clearChatCacheInfo',
}

export enum NTChannel {
  IPC_UP_1 = 'IPC_UP_1',
  IPC_UP_2 = 'IPC_UP_2',
  IPC_UP_3 = 'IPC_UP_3',
  IPC_UP_4 = 'IPC_UP_4',
  RM_IPC_FROM_RENDERER_2 = 'RM_IPCFROM_RENDERER2',
  RM_IPC_FROM_RENDERER_3 = 'RM_IPCFROM_RENDERER3'
}

interface NTService {
  nodeIKernelBuddyService: NodeIKernelBuddyService
  nodeIKernelProfileService: NodeIKernelProfileService
  nodeIKernelGroupService: NodeIKernelGroupService
  nodeIKernelProfileLikeService: NodeIKernelProfileLikeService
  nodeIKernelMsgService: NodeIKernelMsgService
  nodeIKernelMSFService: NodeIKernelMSFService
  nodeIKernelUixConvertService: NodeIKernelUixConvertService
  nodeIKernelRichMediaService: NodeIKernelRichMediaService
  nodeIKernelTicketService: NodeIKernelTicketService
  nodeIKernelTipOffService: NodeIKernelTipOffService
  nodeIKernelRobotService: NodeIKernelRobotService
  nodeIKernelNodeMiscService: NodeIKernelNodeMiscService
  nodeIKernelRecentContactService: NodeIKernelRecentContactService
}

interface InvokeOptions<ReturnType> {
  className?: NTClass
  channel?: NTChannel
  registerEvent?: boolean
  cbCmd?: string | string[]
  cmdCB?: (payload: ReturnType, result: unknown) => boolean
  afterFirstCmd?: boolean // 是否在methodName调用完之后再去hook cbCmd
  timeout?: number
}

let channel: NTChannel

function getChannel() {
  if (channel) {
    return channel
  }
  const names = ipcMain.eventNames()
  for (const chn of [NTChannel.IPC_UP_2, NTChannel.IPC_UP_3, NTChannel.RM_IPC_FROM_RENDERER_2, NTChannel.RM_IPC_FROM_RENDERER_3]) {
    if (names.includes(chn)) {
      return channel = chn
    }
  }
}

export function invoke<
  R extends Awaited<ReturnType<Extract<NTService[S][M], (...args: any) => unknown>>>,
  S extends keyof NTService = any,
  M extends keyof NTService[S] & string = any
>(method: Extract<unknown, `${S}/${M}`> | string, args: unknown[], options: InvokeOptions<R> = {}) {
  const className = options.className ?? NTClass.NT_API
  const channel = options.channel ?? getChannel()
  const timeout = options.timeout ?? 5000
  return new Promise<R>((resolve, reject) => {
    if (!channel) {
      log(`no ntqq api channel found`)
      reject('no ntqq api channel found')
      return
    }
    let eventName = className + '-' + channel[channel.length - 1]
    let apiArgs: unknown[] | { cmdName: string, cmdType: 'invoke', payload: unknown[] } | string = [method, ...args]
    if (getBuildVersion() >= 32690) {
      if (className in newEventName) {
        eventName = newEventName[className]
      } else {
        eventName = className.split('-')[1]
      }
      if (options.registerEvent) {
        apiArgs = method
      } else {
        apiArgs = { cmdName: method, cmdType: 'invoke', payload: args }
      }
    }
    if (options.registerEvent) {
      eventName += '-register'
    }
    const callbackId = randomUUID()
    let eventId: string

    const timeoutId = setTimeout(() => {
      if (eventId) {
        removeReceiveHook(eventId)
      }
      log(`ntqq api timeout ${channel}, ${eventName}, ${method}`, args)
      reject(`ntqq api timeout ${channel}, ${eventName}, ${method}, ${JSON.stringify(args)}`)
    }, timeout)

    if (!options.cbCmd) {
      // QQ后端会返回结果，并且可以根据uuid识别
      hookApiCallbacks.set(callbackId, res => {
        clearTimeout(timeoutId)
        resolve(res)
      })
    }
    else {
      const afterFirstCmd = options.afterFirstCmd ?? true
      let result: unknown
      // 这里的callback比较特殊，QQ后端先返回是否调用成功，再返回一条结果数据
      const secondCallback = () => {
        eventId = registerReceiveHook<R>(options.cbCmd!, (payload) => {
          if (options.cmdCB) {
            if (!options.cmdCB(payload, result)) {
              return
            }
          }
          removeReceiveHook(eventId)
          clearTimeout(timeoutId)
          resolve(payload)
        })
      }
      if (!afterFirstCmd) {
        secondCallback()
      }
      hookApiCallbacks.set(callbackId, (res: GeneralCallResult) => {
        if (res?.result === 0 || ['undefined', 'number'].includes(typeof res)) {
          result = res
          if (afterFirstCmd) {
            secondCallback()
          }
        }
        else {
          clearTimeout(timeoutId)
          if (eventId) {
            removeReceiveHook(eventId)
          }
          reject(new DetailedError(`call failed, ${method}, ${JSON.stringify(res)}`, res))
        }
      })
    }

    ipcMain.emit(
      channel,
      {
        sender: {
          send: () => {
          },
        },
      },
      { type: 'request', callbackId, eventName, peerId: Number(channel.slice(-1)) },
      apiArgs,
    )
  })
}
