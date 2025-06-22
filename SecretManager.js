import { promises as fs } from 'fs'
import path from 'path'

/**
 * SecretManager 用于安全地读取和写入敏感信息（如API密钥等），默认存储为JSON文件
 */
export class SecretManager {
  /**
   * @param {string} [filePath] - 存储敏感信息的文件路径
   */
  constructor(filePath = './secrets.json') {
    this.filePath = path.resolve(filePath)
    this.cache = null
  }

  /**
   * 读取所有敏感信息
   * @returns {Promise<object>}
   */
  async readSecrets() {
    if (this.cache) return this.cache
    try {
      const content = await fs.readFile(this.filePath, 'utf-8')
      this.cache = JSON.parse(content)
      return this.cache
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.cache = {}
        return {}
      }
      throw err
    }
  }

  /**
   * 获取指定 key 的敏感信息
   * @param {string} key
   * @returns {Promise<string|undefined>}
   */
  async getSecret(key) {
    const secrets = await this.readSecrets()
    return secrets[key]
  }

  /**
   * 设置指定 key 的敏感信息
   * @param {string} key
   * @param {string} value
   * @returns {Promise<void>}
   */
  async setSecret(key, value) {
    const secrets = await this.readSecrets()
    secrets[key] = value
    await fs.writeFile(this.filePath, JSON.stringify(secrets, null, 2), 'utf-8')
    this.cache = secrets
  }
}