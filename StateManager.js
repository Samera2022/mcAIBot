export class StateManager {
  /**
   * @param {import('mineflayer').Bot} bot
   */
  constructor(bot) {
    this.bot = bot
    this.isFollowing = false
    this.isWorking = false
    this.followTarget = null
    this.workType = null
  }

  /**
   * 开始跟随玩家
   * @param {string} [username] - 可选，指定跟随的玩家名
   */
  startFollow(username) {
    const target = username
      ? this.bot.players[username]?.entity
      : this._getFirstPlayerEntity()
    if (!target) {
      this.bot.chat('未找到要跟随的玩家')
      return
    }
    this.isFollowing = true
    this.followTarget = target
    if (this.bot.pathfinder) {
      const { Movements, goals } = require('mineflayer-pathfinder')
      const defaultMove = new Movements(this.bot)
      this.bot.pathfinder.setMovements(defaultMove)
      this.bot.pathfinder.setGoal(new goals.GoalFollow(target, 1), true)
    }
    this.bot.chat(`开始跟随${username ? username : target.username}`)
  }

  /**
   * 停止跟随玩家
   */
  stopFollow() {
    this.isFollowing = false
    this.followTarget = null
    if (this.bot.pathfinder) {
      this.bot.pathfinder.setGoal(null)
    }
    this.bot.chat('已停止跟随')
  }

  /**
   * 开始工作（如PVP、守卫等）
   * @param {string} type - 工作类型
   * @param {object} [options] - 额外参数
   */
  startWork(type, options = {}) {
    this.isWorking = true
    this.workType = type
    // 可根据 type 调用不同的 manager
    this.bot.chat(`开始${type}工作`)
  }

  /**
   * 停止所有活动（跟随、工作等）
   */
  stopAll() {
    this.isFollowing = false
    this.isWorking = false
    this.followTarget = null
    this.workType = null
    if (this.bot.pathfinder) {
      this.bot.pathfinder.setGoal(null)
    }
    this.bot.chat('所有活动已停止')
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