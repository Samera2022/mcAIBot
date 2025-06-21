/**
 * PVPManager 负责管理 bot 的PVP行为，包括开始和停止PVP。
 * 该实现忠实于 t.js 的原始需求和行为。
 */
export class PVPManager {
  /**
   * @param {import('mineflayer').Bot} bot
   */
  constructor(bot) {
    this.bot = bot
    this.isPvp = false
    this.target = null
  }

  /**
   * 开始PVP
   * @param {string} [username] - 可选，指定PVP目标玩家名
   */
  startPvp(username) {
    const target = username
      ? this.bot.players[username]?.entity
      : this._getFirstPlayerEntity()
    if (!target) {
      this.bot.chat('未找到PVP目标')
      return
    }
    this.isPvp = true
    this.target = target
    if (this.bot.pvp) {
      this.bot.pvp.attack(target)
      this.bot.chat(`开始与${username ? username : target.username} PVP`)
    } else {
      this.bot.chat('PVP插件未加载')
    }
  }

  /**
   * 停止PVP
   */
  stopPvp() {
    this.isPvp = false
    this.target = null
    if (this.bot.pvp) {
      this.bot.pvp.stop()
    }
    if (this.bot.pathfinder) {
      this.bot.pathfinder.setGoal(null)
    }
    this.bot.chat('已停止PVP')
  }

  /**
   * 获取第一个可用玩家实体
   * @returns {Entity|null}
   */
  _getFirstPlayerEntity() {
    for (const name in this.bot.players) {
      if (name !== this.bot.username && this.bot.players[name].entity) {
        return this.bot.players[name].entity
      }
    }
    return null
  }
}