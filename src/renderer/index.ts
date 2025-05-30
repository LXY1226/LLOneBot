import { CheckVersion, Config } from '../common/types'
import { SettingButton, SettingItem, SettingList, SettingSwitch, SettingSelect, SettingInput } from './components'
import { version } from '../version'
// @ts-expect-error: Unreachable code error
import StyleRaw from './style.css?raw'

type HostsType = 'httpHosts' | 'wsHosts'

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === ''
}

async function onSettingWindowCreated(view: Element) {
  console.log(view)
  if (!view){
    return
  }
  const config = await window.llonebot.getConfig()
  const ob11Config = { ...config.ob11 }

  const setConfig = (key: string, value: unknown) => {
    const configKey = key.split('.')
    if (key.startsWith('ob11')) {
      if (configKey.length === 2) Object.assign(ob11Config, { [configKey[1]]: value })
      else Object.assign(ob11Config, { [key]: value })
    } else {
      if (configKey.length === 2) {
        Object.assign(config[configKey[0] as keyof Config[keyof Config]], { [configKey[1]]: value })
      } else {
        Object.assign(config, { [key]: value })
      }
    }
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(
    [
      '<div>',
      `<style>${StyleRaw}</style>`,
      `<setting-section id="llonebot-error">
        <setting-panel><pre><code></code></pre></setting-panel>
      </setting-section>`,
      SettingList([
        SettingItem(
          '<span id="llonebot-update-title">正在检查 LLOneBot 更新</span>',
          null,
          SettingButton('请稍候', 'llonebot-update-button', 'secondary'),
        ),
      ]),
      SettingList([
        SettingItem(
          '是否启用 LLOneBot，重启 QQ 后生效',
          null,
          SettingSwitch('enableLLOB', config.enableLLOB, { 'control-display-id': 'config-enableLLOB' }),
        )
      ]),
      SettingList([
        SettingItem(
          '是否启用 Satori 协议',
          '重启 QQ 后生效',
          SettingSwitch('satori.enable', config.satori.enable),
        ),
        SettingItem(
          '服务端口',
          null,
          SettingInput('satori.port', 'port', config.satori.port, config.satori.port),
        ),
        SettingItem(
          '服务令牌',
          null,
          SettingInput('satori.token', 'text', config.satori.token, '未设置', 'width:170px;'),
        ),
        SettingItem('', null, SettingButton('保存', 'config-ob11-save', 'primary')),
      ]),
      SettingList([
        SettingItem(
          '是否启用 OneBot 协议',
          '重启 QQ 后生效',
          SettingSwitch('ob11.enable', config.ob11.enable),
        ),
        SettingItem(
          '启用 HTTP 服务',
          null,
          SettingSwitch('ob11.enableHttp', config.ob11.enableHttp, { 'control-display-id': 'config-ob11-httpPort' }),
        ),
        SettingItem(
          'HTTP 服务监听端口',
          null,
          SettingInput('ob11.httpPort', 'port', config.ob11.httpPort, config.ob11.httpPort),
          'config-ob11-httpPort',
          config.ob11.enableHttp,
        ),
        SettingItem(
          '启用 HTTP 心跳',
          null,
          SettingSwitch('ob11.enableHttpHeart', config.ob11.enableHttpHeart, {
            'control-display-id': 'config-ob11-enableHttpHeart',
          }),
        ),
        SettingItem(
          '启用 HTTP 事件上报',
          null,
          SettingSwitch('ob11.enableHttpPost', config.ob11.enableHttpPost, {
            'control-display-id': 'config-ob11-httpHosts',
          }),
        ),
        `<div class="config-host-list" id="config-ob11-httpHosts" ${config.ob11.enableHttpPost ? '' : 'is-hidden'}>
                <setting-item data-direction="row">
                    <div>
                        <setting-text>HTTP 事件上报密钥</setting-text>
                    </div>
                    <div class="q-input">
                        <input id="config-ob11-httpSecret" class="q-input__inner" data-config-key="ob11.httpSecret" type="text" value="${config.ob11.httpSecret}" placeholder="未设置" />
                    </div>
                </setting-item>
                <setting-item data-direction="row">
                    <div>
                        <setting-text>HTTP 事件上报地址</setting-text>
                    </div>
                    <setting-button id="config-ob11-httpHosts-add" data-type="primary">添加</setting-button>
                </setting-item>
                <div id="config-ob11-httpHosts-list"></div>
            </div>`,
        SettingItem(
          '启用正向 WebSocket 服务',
          null,
          SettingSwitch('ob11.enableWs', config.ob11.enableWs, { 'control-display-id': 'config-ob11-wsPort' }),
        ),
        SettingItem(
          '正向 WebSocket 服务监听端口',
          null,
          `<div class="q-input"><input class="q-input__inner" data-config-key="ob11.wsPort" type="number" min="1" max="65534" value="${config.ob11.wsPort}" placeholder="${config.ob11.wsPort}" /></div>`,
          'config-ob11-wsPort',
          config.ob11.enableWs,
        ),
        SettingItem(
          '启用反向 WebSocket 服务',
          null,
          SettingSwitch('ob11.enableWsReverse', config.ob11.enableWsReverse, {
            'control-display-id': 'config-ob11-wsHosts',
          }),
        ),
        `<div class="config-host-list" id="config-ob11-wsHosts" ${config.ob11.enableWsReverse ? '' : 'is-hidden'}>
                <setting-item data-direction="row">
                    <div>
                        <setting-text>反向 WebSocket 监听地址</setting-text>
                    </div>
                    <setting-button id="config-ob11-wsHosts-add" data-type="primary">添加</setting-button>
                </setting-item>
                <div id="config-ob11-wsHosts-list"></div>
            </div>`,
        SettingItem(
          'WebSocket 服务心跳间隔',
          '控制每隔多久发送一个心跳包，单位为毫秒',
          `<div class="q-input"><input class="q-input__inner" data-config-key="heartInterval" type="number" min="1000" value="${config.heartInterval}" placeholder="${config.heartInterval}" /></div>`,
        ),
        SettingItem(
          'Access token',
          null,
          `<div class="q-input" style="width:170px;"><input class="q-input__inner" data-config-key="token" type="text" value="${config.token}" placeholder="未设置" /></div>`,
        ),
        SettingItem(
          '新消息上报格式',
          '如客户端无特殊需求推荐保持默认设置，两者的详细差异可参考 <a href="javascript:LiteLoader.api.openExternal(\'https://github.com/botuniverse/onebot-11/tree/master/message#readme\');">OneBot v11 文档</a>',
          SettingSelect(
            [
              { text: '消息段', value: 'array' },
              { text: 'CQ 码', value: 'string' },
            ],
            'ob11.messagePostFormat',
            config.ob11.messagePostFormat,
          ),
        ),
        SettingItem(
          'HTTP、正向 WebSocket 服务仅监听 127.0.0.1',
          '而不是 0.0.0.0',
          SettingSwitch('ob11.listenLocalhost', config.ob11.listenLocalhost),
        ),
        SettingItem(
          '上报 Bot 自身发送的消息',
          '上报 event 为 message_sent',
          SettingSwitch('ob11.reportSelfMessage', config.ob11.reportSelfMessage),
        ),
        SettingItem(
          '使用 Base64 编码获取文件',
          '调用 /get_image、/get_record、/get_file 时，没有 url 时添加 Base64 字段',
          SettingSwitch('enableLocalFile2Url', config.enableLocalFile2Url),
        ),
        SettingItem('', null, SettingButton('保存', 'config-ob11-save-2', 'primary')),
      ]),
      SettingList([
        SettingItem(
          'FFmpeg 路径，发送语音、视频需要',
          `<a href="javascript:LiteLoader.api.openExternal(\'https://llonebot.github.io/zh-CN/guide/ffmpeg\');">可点此下载</a>, 路径: <span id="config-ffmpeg-path-text">${!isEmpty(config.ffmpeg) ? config.ffmpeg : '未指定'
          }</span>, 需保证 FFprobe 和 FFmpeg 在一起`,
          SettingButton('选择 FFmpeg', 'config-ffmpeg-select'),
        ),
        SettingItem(
          '音乐卡片签名 URL 地址',
          null,
          `<div class="q-input" style="width:210px;"><input class="q-input__inner" data-config-key="musicSignUrl" type="text" value="${config.musicSignUrl}" placeholder="未设置" /></div>`,
          'config-musicSignUrl',
        ),
        SettingItem(
          '自动删除收到的文件',
          '在收到文件后的指定时间内删除该文件',
          SettingSwitch('autoDeleteFile', config.autoDeleteFile, {
            'control-display-id': 'config-auto-delete-file-second',
          }),
        ),
        SettingItem(
          '自动删除文件时间',
          '单位为秒',
          `<div class="q-input"><input class="q-input__inner" data-config-key="autoDeleteFileSecond" type="number" min="1" value="${config.autoDeleteFileSecond}" placeholder="${config.autoDeleteFileSecond}" /></div>`,
          'config-auto-delete-file-second',
          config.autoDeleteFile,
        ),
        SettingItem('写入日志', `将日志文件写入插件的数据文件夹`, SettingSwitch('log', config.log)),
        SettingItem(
          '日志文件目录',
          `${window.LiteLoader.plugins['LLOneBot'].path.data}/logs`,
          SettingButton('打开', 'config-open-log-path'),
        ),
        SettingItem(
          '消息内容缓存时长',
          '单位为秒，可用于获取撤回的消息',
          `<div class="q-input"><input class="q-input__inner" data-config-key="msgCacheExpire" type="number" min="1" value="${config.msgCacheExpire}" placeholder="${config.msgCacheExpire}" /></div>`,
        ),
        SettingItem(
          '发包器端口',
          `<a href="javascript:LiteLoader.api.openExternal(\'https://llonebot.github.io/zh-CN/guide/pmhq\');">配置文档</a>`,
          `<div class="q-input"><input class="q-input__inner" data-config-key="packetPort" type="number" value="${config.packetPort}" placeholder="未设置" /></div>`
        ),
        SettingItem('', null, SettingButton('保存', 'config-ob11-save-3', 'primary')),
      ]),
      SettingList([
        SettingItem('GitHub 仓库', `https://github.com/LLOneBot/LLOneBot`, SettingButton('点个星星', 'open-github')),
        SettingItem('LLOneBot 文档', `https://llonebot.github.io/`, SettingButton('看看文档', 'open-docs')),
        SettingItem('Telegram 群', `https://t.me/+nLZEnpne-pQ1OWFl`, SettingButton('进去逛逛', 'open-telegram')),
        SettingItem('QQ 群', `545402644`, SettingButton('我要进去', 'open-qq-group')),
      ]),
      '</div>',
    ].join(''),
    'text/html',
  )

  const showError = async () => {
    await new Promise((res) => setTimeout(() => res(true), 1000))

    const errDom = document.querySelector('#llonebot-error') || doc.querySelector('#llonebot-error')
    const errCodeDom = errDom?.querySelector('code')
    const errMsg = await window.llonebot.getError()

    if (!errMsg) {
      errDom?.classList.remove('show')
    } else {
      errDom?.classList.add('show')
    }
    if (errCodeDom) {
      errCodeDom.innerHTML = errMsg
    }
  }
  showError().then()

  // 外链按钮
  doc.querySelector('#open-github')?.addEventListener('click', () => {
    window.LiteLoader.api.openExternal('https://github.com/LLOneBot/LLOneBot')
  })
  doc.querySelector('#open-telegram')?.addEventListener('click', () => {
    window.LiteLoader.api.openExternal('https://t.me/+nLZEnpne-pQ1OWFl')
  })
  doc.querySelector('#open-qq-group')?.addEventListener('click', () => {
    window.LiteLoader.api.openExternal('https://qm.qq.com/q/bDnHRG38aI')
  })
  doc.querySelector('#open-docs')?.addEventListener('click', () => {
    window.LiteLoader.api.openExternal('https://llonebot.github.io/')
  })
  // 生成反向地址列表
  const buildHostListItem = (type: HostsType, host: string, index: number, inputAttrs = {}) => {
    const dom = {
      container: document.createElement('setting-item'),
      input: document.createElement('input'),
      inputContainer: document.createElement('div'),
      deleteBtn: document.createElement('setting-button'),
    }
    dom.container.classList.add('setting-host-list-item')
    dom.container.dataset.direction = 'row'
    Object.assign(dom.input, inputAttrs)
    dom.input.classList.add('q-input__inner')
    dom.input.type = 'url'
    dom.input.value = host
    dom.input.addEventListener('input', () => {
      ob11Config[type][index] = dom.input.value
    })

    dom.inputContainer.classList.add('q-input')
    dom.inputContainer.appendChild(dom.input)

    dom.deleteBtn.innerHTML = '删除'
    dom.deleteBtn.dataset.type = 'secondary'
    dom.deleteBtn.addEventListener('click', () => {
      ob11Config[type].splice(index, 1)
      initReverseHost(type)
    })

    dom.container.appendChild(dom.inputContainer)
    dom.container.appendChild(dom.deleteBtn)

    return dom.container
  }
  const buildHostList = (hosts: string[], type: HostsType, inputAttr = {}) => {
    const result: HTMLElement[] = []

    hosts.forEach((host, index) => {
      result.push(buildHostListItem(type, host, index, inputAttr))
    })

    return result
  }
  const addReverseHost = (type: HostsType, doc: Document = document, inputAttr = {}) => {
    const hostContainerDom = doc.body.querySelector(`#config-ob11-${type}-list`)
    hostContainerDom?.appendChild(buildHostListItem(type, '', ob11Config[type].length, inputAttr))
    ob11Config[type].push('')
  }
  const initReverseHost = (type: HostsType, doc: Document = document) => {
    const hostContainerDom = doc.body.querySelector(`#config-ob11-${type}-list`)!
    const nodes = [...hostContainerDom.childNodes]
    nodes.forEach((dom) => dom.remove())
    buildHostList(ob11Config[type], type).forEach((dom) => {
      hostContainerDom?.appendChild(dom)
    })
  }
  initReverseHost('httpHosts', doc)
  initReverseHost('wsHosts', doc)

  doc
    .querySelector('#config-ob11-httpHosts-add')
    ?.addEventListener('click', () =>
      addReverseHost('httpHosts', document, { placeholder: '如：http://127.0.0.1:5140/onebot' }),
    )
  doc
    .querySelector('#config-ob11-wsHosts-add')
    ?.addEventListener('click', () =>
      addReverseHost('wsHosts', document, { placeholder: '如：ws://127.0.0.1:5140/onebot' }),
    )

  doc.querySelector('#config-ffmpeg-select')?.addEventListener('click', () => {
    window.llonebot.selectFile().then((path) => {
      if (!isEmpty(path)) {
        setConfig('ffmpeg', path)
        document.querySelector('#config-ffmpeg-path-text')!.innerHTML = path
      }
    })
  })

  doc.querySelector('#config-open-log-path')?.addEventListener('click', () => {
    window.LiteLoader.api.openPath(window.LiteLoader.plugins['LLOneBot'].path.data)
  })

  // 开关
  doc.querySelectorAll('setting-switch[data-config-key]').forEach(element => {
    const dom = element as HTMLElement
    dom.addEventListener('click', () => {
      const active = dom.getAttribute('is-active') === null

      setConfig(dom.dataset.configKey!, active)

      if (active) dom.setAttribute('is-active', '')
      else dom.removeAttribute('is-active')

      if (!isEmpty(dom.dataset.controlDisplayId)) {
        const displayDom = document.querySelector(`#${dom.dataset.controlDisplayId}`)
        if (active) displayDom?.removeAttribute('is-hidden')
        else displayDom?.setAttribute('is-hidden', '')
      }
    })
  })

  // 输入框
  doc
    .querySelectorAll('setting-item .q-input input.q-input__inner[data-config-key]')
    .forEach(element => {
      const dom = element as HTMLInputElement
      dom.addEventListener('input', () => {
        const Type = dom.getAttribute('type')
        const configKey = dom.dataset.configKey
        const configValue = Type === 'number' ? (parseInt(dom.value) >= 1 ? parseInt(dom.value) : 0) : dom.value

        setConfig(configKey!, configValue)
      })
    })

  // 下拉框
  doc?.querySelectorAll('ob-setting-select[data-config-key]').forEach(element => {
    const dom = element as HTMLElement
    dom?.addEventListener('selected', e => {
      const { detail } = e as CustomEvent
      const configKey = dom.dataset.configKey
      const configValue = detail.value

      setConfig(configKey!, configValue)
    })
  })

  // 保存按钮
  doc.querySelector('#config-ob11-save')?.addEventListener('click', () => {
    config.ob11 = ob11Config

    window.llonebot.setConfig(false, config)
    // window.location.reload();
    showError().then()
    alert('保存成功')
  })

  doc.querySelector('#config-ob11-save-2')?.addEventListener('click', () => {
    config.ob11 = ob11Config

    window.llonebot.setConfig(false, config)
    showError().then()
    alert('保存成功')
  })

  doc.querySelector('#config-ob11-save-3')?.addEventListener('click', () => {
    config.ob11 = ob11Config

    window.llonebot.setConfig(false, config)
    showError().then()
    alert('保存成功')
  })

  doc.body.childNodes.forEach((node) => {
    view.appendChild(node)
  })
  // 更新逻辑
  async function checkVersionFunc(info: CheckVersion) {
    const titleDom = view.querySelector<HTMLSpanElement>('#llonebot-update-title')!
    const buttonDom = view.querySelector<HTMLButtonElement>('#llonebot-update-button')!

    if (info.version === '') {
      titleDom.innerHTML = `当前版本为 v${version}，检查更新失败`
      buttonDom.innerHTML = '点击重试'

      buttonDom.addEventListener('click', async () => {
        window.llonebot.checkVersion().then(checkVersionFunc)
      }, { once: true })
    } else if (!info.result) {
      titleDom.innerHTML = '当前已是最新版本 v' + version
      buttonDom.innerHTML = '无需更新'
    } else {
      titleDom.innerHTML = `当前版本为 v${version}，最新版本为 v${info.version}`
      buttonDom.innerHTML = '点击更新'
      buttonDom.dataset.type = 'primary'

      const update = async () => {
        buttonDom.innerHTML = '正在更新中...'
        const result = await window.llonebot.updateLLOneBot()
        if (result) {
          buttonDom.innerHTML = '更新完成，请重启'
        } else {
          buttonDom.innerHTML = '更新失败，前往仓库下载'
        }

        buttonDom.removeEventListener('click', update)
      }
      buttonDom.addEventListener('click', update)
    }
  }
  window.llonebot.checkVersion().then(checkVersionFunc)
  window.addEventListener('beforeunload', () => {
    window.llonebot.getConfig().then(oldConfig => {
      if (JSON.stringify(oldConfig) !== JSON.stringify(config)) {
        window.llonebot.setConfig(true, config)
      }
    })
  })
}

/**function init() {
  const hash = location.hash
  if (hash === '#/blank') {
  }
}

if (location.hash === '#/blank') {
  globalThis.navigation?.addEventListener('navigatesuccess', init, { once: true })
} else {
  init()
}*/

export { onSettingWindowCreated }
