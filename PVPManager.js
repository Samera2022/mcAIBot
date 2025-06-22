/**
 * PVPManager 负责管理 bot 的PVP行为，包括开始和停止PVP。
 */
import { bot, lang } from './botMain.js'
export class PVPManager {

  constructor() {
    this.isPvp = false
    this.target = null
  }

  /**
   * 开始PVP
   * @param {string} [username] - 可选，指定PVP目标玩家名
   */
  startPvp(username) {
    const target = username
      ? bot.players[username]?.entity
      : this._getFirstPlayerEntity()
    if (!target) {
      bot.chat('未找到PVP目标')
      return
    }
    this.isPvp = true
    this.target = target
    if (bot.pvp) {
      bot.pvp.attack(target)
      bot.chat(`开始与${username ? username : target.username} PVP`)
    } else {
      bot.chat('PVP插件未加载')
    }
  }

  /**
   * 停止PVP
   */
  stopPvp() {
    this.isPvp = false
    this.target = null
    if (bot.pvp) {
      bot.pvp.stop()
    }
    if (bot.pathfinder) {
      bot.pathfinder.setGoal(null)
    }
    bot.chat('已停止PVP')
  }

  /**
   * 获取第一个可用玩家实体
   * @returns {Entity|null}
   */
  _getFirstPlayerEntity() {
    for (const name in bot.players) {
      if (name !== bot.username && bot.players[name].entity) {
        return bot.players[name].entity
      }
    }
    return null
  }
}