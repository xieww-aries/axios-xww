import axios from 'axios'
import { showTip } from './common'
import { isObject, trim } from './types'
import requestAddress from './request-address'
import { getCookie, jumpLoginHtml, invalidToken, createUuid } from './request-help'
import { getBrowserType } from './browser'
import { domainCode, domainName } from './index'
import ButtomControl from '../modal/button-control'
import loadControl from '@/modal/load-control'
import { Notification } from 'element-ui'
const { openloading, closeloading } = loadControl.loading()
const { disableButton, enableButton } = ButtomControl.getButtonControlHandlers()
// 定义拦截器的动作, 从下到上依次执行
const actions = {
  request: [
    disableButton, // 请求时, 禁用按钮, 且放到最后
    checkParams,
    addPragmaHeaderForIE,
    addAuthorizationHeads,
    checkNetwork,
    changeUser
  ],
  response: [
    [resolveResponse, handleResponseError]
  ],
}

// 是否断网
function checkNetwork (config) {
  if (navigator && navigator.onLine === false) {
    const tip = '网络走丢了，请稍后再试'
    return Promise.reject(tip)
  } else {
    return config
  }
}
// 切换用户
function changeUser (config) {
  let userName = getCookie(domainCode() + '_user', {
    domain: domainName(),
  })
  let userNamed = sessionStorage.getItem(domainCode() + '_user')
  if (userNamed && userName) {
    if (userNamed !== userName) {
      Notification({
        title: '温馨提示',
        message: '登录用户已经无效，将自动切换为新用户',
        duration: 5000,
        type: 'success',
        onClose: () => {
          location.reload()
        },
      })
      sessionStorage.setItem(domainCode() + '_user', userName)
    }
  }

  return config
}
// 过滤get请求params里面无value的key(trim()后为'', null, undefined)
function checkParams (config) {
  if (config.loadParams) {
    openloading(config.loadParams.server, config.loadParams.el)
  }
  const { method, params, headers } = config
  if (method === 'get') {
    if (getBrowserType() === 'IE') {
      headers.common['Pragma'] = 'no-cache'
    }
    for (let key in params) {
      let value = params[key]
      if (!value || (typeof value === 'string' && trim(value) === '')) {
        delete params[key]
      }
    }
  }
  return config
}

// 获取添加token的拦截器
function addAuthorizationHeads (config) {
  const code = getCookie(domainCode(), {
    domain: domainName(),
  })
  // const code =
  //   'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsIng1dCI6IjJrazVUVFROTnRXaTZRMGJGYkkzZzNQTENJMD0ifQ.eyJpZCI6IjE0IiwibmFtZSI6Inl1YW5uYTEyIiwiYXVkIjoiaHR0cHM6Ly9tZWVzZXJ2aWNlcy5taW5lY3JhZnQubmV0IiwiaXNzIjoiaHR0cHM6Ly93d3cuamRjbG91ZC5jb20vIiwiaWF0IjoxNTg3OTgyNTI5LCJuYmYiOjE1ODc5ODI1MjksImV4cCI6MTU4ODAwMjUwOSwiYWNyIjoiMSIsImFpbyI6IjQyMUFBcEY2MFJmQmo3c29mdDE4MEZGM3VWVk8xUCIsImFwcGlkIjoiYjM2YjE0MzItMWExYy00YzgyLTliNzYtMjRkZTFjYWI0MmYyIiwiYW1yIjpbInB3ZCJdLCJhcHBpZGFjciI6IjAiLCJkZXZpY2VpZCI6ImNlODQyMDVkLTdkZTItNGE3NS04M2E4LTRmN2FiZTgwZjY3YyIsImZhbWlseV9uYW1lIjoibWluZyIsImdpdmVuX25hbWUiOiJ4aW5nIiwiaXBhZGRyIjoiIiwib2lkIjoiNjc4MDFlZWQzZDMxNGI4ZGI3ZmNkYTI3ZGI4ZDE3MTIiLCJwdWlkIjoiMTAwMzdGRkU5OTk1QUQ2OSIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6Im1lZUBqZGNsb3VkLmNvbSIsInRpZCI6IjYiLCJ1bmlxdWVfbmFtZSI6Inl1YW5uYTEyIiwidXBuIjoieXVhbm5hMTIiLCJ1dGkiOiJSNzRORmhmZDBFV1g5d1RQaGFRTEFBIiwidmVyIjoiMS4wIiwidXNlclJvbGUiOiIzLDEiLCJ0eXBlIjoiMyIsIm9wZW5JZCI6IiIsImFjY2Vzc1Rva2VuIjoiaDlaYmRMRU1ZZ2h0aDJSZER2a000eWVNN1dkMTBjSUgiLCJhY2NvdW50VHlwZSI6IjEiLCJwYXlTdGF0dXMiOjB9.cE-s8O7Z7Gz1cvPskjPQna50xz4qrnGLR01UdC2kllofyKeeXbGEZWXqn828kKQ5aWHoP2sU5oOO57RnrWkKNRI_Mk0ZArOrziQg25evbNAPi-47yWwruotYIFGTi_HOg4cyhlsRBAzQ8iT3ba5Q9nhcfL2ANJ0PhFJc9_EWXoGVYaVaaRUVKH3W3ENGCrbbl9QOl_n_eyxFUJEwkdsG_HhfEWkSEIlo5nBn_UCWtWiB3gjmNvwW7n2Y1oW7MmxugPdHUk-NJXna_a1ngdahLeaQt5vcZtIy6uYplgHRHXWTjzkCcAbIlRRnIWCs3TraGVuVoOsRqo-SkTMt2UChMg'
  if (code === null) {
    jumpLoginHtml()
  }

  const { headers } = config
  headers.common['Authorization'] = code
  headers.common['traceId'] = createUuid()

  return config
}

// ie浏览器get请求添加'Pragma': 'no-cache';解决ie get请求缓存问题
function addPragmaHeaderForIE (config) {
  const { method, headers } = config
  if (method === 'get' && getBrowserType() === 'IE') {
    headers.common['Pragma'] = 'no-cache'
  }
  return config
}
// 响应成功
function resolveResponse (response) {
  const { data, config } = response
  const { msgSuccess, returnRawData } = config
  enableButton()
  if (msgSuccess) {
    handleCustomInfo(msgSuccess, 'success')
  }
  if (config.loadParams) {
    closeloading(config.loadParams.server)
  }
  if (returnRawData) {
    return response
  }
  return data
}
// 响应错误
function handleResponseError (error) {
  const response = error.response
  const { status, data, config } = response
  const { showBackendError, msgFail, returnRawData } = config

  // 放开按钮
  enableButton()
  if (config.loadParams) {
    closeloading(config.loadParams.server)
  }
  switch (status) {
    case 401:
      handleCustomInfo(data.msg)
      invalidToken()
      break
  }
  if (showBackendError) {
    if (msgFail) {
      handleCustomInfo(msgFail)
    } else {
      handleCustomInfo(data.msg)
    }
    if (returnRawData) {
      return response
    }
  }
  if (returnRawData) {
    return Promise.reject(response)
  }
  return Promise.reject(data)
}

// 处理提示信息
function handleCustomInfo (msg, type = 'error') {
  return showTip(msg, type)
}

// 默认的错误处理机制: 抛出错误
function defaultErrorHandler (error) {
  enableButton()
  if (error instanceof Error) {
    throw error
  }
  if (typeof error === 'string') {
    throw new Error(error)
  }
}
// 添加请求 / 响应 的拦截器
function addInterceptors (client, type, action, actionErrorHandler = defaultErrorHandler) {
  // 如果存在存在自定义错误处理器, 则使用自定义的错误处理handler
  if (Array.isArray(action)) {
    actionErrorHandler = action[1]
    action = action[0]
  }

  return client.interceptors[type].use(action, actionErrorHandler)
}

function createAxios (config) {
  const client = axios.create(config)
  client.defaults.withCredentials = true

  // 过滤器执行顺序从下到上
  Object.keys(actions).forEach(actionType => actions[actionType].forEach(oneAction => addInterceptors(client, actionType, oneAction)))
  return client
}

/**
 * 创建1个Axios对象, 用来发送请求
 *
 * @export
 * @param {*} [userConfig={}]
 * @returns
 */
export function getAxiosClient (userConfig = {}) {
  if (!isObject(userConfig)) {
    throw new Error('配置必须是对象格式')
  }
  const config = {
    baseURL: requestAddress,
    withCredentials: true, // 跨域时， 允许cookie传输
  }

  return createAxios(Object.assign(config, userConfig))
}

export const axiosClient = getAxiosClient()
