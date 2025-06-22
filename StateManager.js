import pkg from 'mineflayer-pathfinder'
const { Movements, goals } = pkg
import { bot, lang } from './botMain.js'

export class StateManager {
  constructor() {
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
      ? bot.players[username]?.entity
      : this._getFirstPlayerEntity()
    if (!target) {
      const msg = lang.t('warn.follow.not_found')
      if (msg) bot.chat(msg)
      return
    }
    this.isFollowing = true
    this.followTarget = target
    if (bot.pathfinder) {
      const defaultMove = new Movements(bot)
      bot.pathfinder.setMovements(defaultMove)
      bot.pathfinder.setGoal(new goals.GoalFollow(target, 1), true)
    }
    const msg = lang.t('info.follow.start', { username: username ? username : target.username })
    if (msg) bot.chat(msg)
  }

  /**
   * 停止跟随玩家
   */
  stopFollow() {
    this.isFollowing = false
    this.followTarget = null
    if (bot.pathfinder) {
      bot.pathfinder.setGoal(null)
    }
    const msg = lang.t('info.follow.stop')
    if (msg) bot.chat(msg)
  }

  /**
   * 开始工作（如PVP、守卫等）
   * @param {string} type - 工作类型
   * @param {object} [options] - 额外参数
   */
  startWork(type, options = {}) {
    this.isWorking = true
    this.workType = type
    const msg = lang.t('info.work.start', { type })
    if (msg) bot.chat(msg)
  }

  /**
   * 停止所有活动（跟随、工作等）
   */
  stopAll() {
    this.isFollowing = false
    this.isWorking = false
    this.followTarget = null
    this.workType = null
    if (bot.pathfinder) {
      bot.pathfinder.setGoal(null)
    }
    const msg = lang.t('info.all.stop')
    if (msg) bot.chat(msg)
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