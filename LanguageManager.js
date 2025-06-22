import fs from 'fs'
import path from 'path'

export class LanguageManager {
  /**
   * @param {string} langCode 语言代码，如 zh_cn
   * @param {string} [langDir] 语言文件目录
   */
  constructor(langCode = 'zh_cn', langDir = './lang') {
    this.langCode = langCode
    this.langDir = langDir
    this.translations = {}
    this._loadLanguageFile()
  }

  _loadLanguageFile() {
    const filePath = path.resolve(this.langDir, `${this.langCode}.json`)
    if (fs.existsSync(filePath)) {
      try {
        this.translations = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      } catch (e) {
        console.error(`语言文件解析失败: ${filePath}`, e)
        this.translations = {}
      }
    } else {
      console.warn(`未找到语言文件: ${filePath}`)
      this.translations = {}
    }
  }

  /**
   * 获取本地化文本
   * @param {string} key
   * @param {object} [params] 可选参数替换
   * @returns {string}
   */
  t(key, params = {}) {
    let text = this.translations[key]
    // if (typeof text !== 'string') {
    //   // key 不存在时
    //   return ''
    // }
    // 替换所有 {变量名} 为 params 中的值
    text = text.replace(/\{(\w+)\}/g, (match, p1) => {
      return params[p1] !== undefined ? params[p1] : match
    })
    return text
  }
}