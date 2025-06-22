/**
 * GuardManager 负责管理 bot 的守卫行为，包括开始和停止守卫。
 */
import { bot, lang } from './botMain.js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { goals } = require('mineflayer-pathfinder')
const Movements = require('mineflayer-pathfinder').Movements

export class GuardManager {
  constructor() {
    this.guardPos = null
    this.movingToGuardPos = false
  }

  /**
   * 开始守卫当前位置或指定玩家位置
   * @param {import('vec3').Vec3} [pos] - 守卫的目标位置，默认守卫自己当前位置
   */
  startGuard(pos) {
    this.guardPos = pos || bot.entity.position.clone()
    if (!bot.pvp.target) this.moveToGuardPos()
    bot.chat(lang.t("info.guard.start"))
  }

  /**
   * 停止守卫
   */
  async stopGuard() {
    this.movingToGuardPos = false
    this.guardPos = null
    if (bot.pvp) await bot.pvp.stop()
    bot.chat(lang.t("info.guard.stop"))
  }

  /**
   * 移动到守卫位置
   * @private
   */
  async moveToGuardPos() {
    if (this.movingToGuardPos || !this.guardPos) return
    const mcData = require('minecraft-data')(bot.version)
    bot.pathfinder.setMovements(new Movements(bot, mcData))
    try {
      this.movingToGuardPos = true
      await bot.pathfinder.goto(new goals.GoalNear(this.guardPos.x, this.guardPos.y, this.guardPos.z, 2))
    } catch (err) {
      // 路径查找失败或被打断
    } finally {
      this.movingToGuardPos = false
    }
  }

  /**
   * 在攻击目标被消灭后回到守卫点
   */
  onStoppedAttacking() {
    if (this.guardPos) this.moveToGuardPos()
  }

  /**
   * 每 tick 检查是否有敌对生物需要攻击
   */
  async onPhysicsTick() {
    if (!this.guardPos) return

    let entity = null
    if (bot.entity.position.distanceTo(this.guardPos) < 16) {
      const filter = e =>
        (e.type === 'hostile' || e.type === 'mob') &&
        e.position.distanceTo(bot.entity.position) < 10 &&
        e.displayName !== 'Armor Stand'
      entity = bot.nearestEntity(filter)
    }

    if (entity && !this.movingToGuardPos) {
      bot.pvp.attack(entity)
    } else {
      if (bot.entity.position.distanceTo(this.guardPos) < 2) return
      if (bot.pvp) await bot.pvp.stop()
      this.moveToGuardPos()
    }
  }
}