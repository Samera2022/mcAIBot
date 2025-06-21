/**
 * GuardManager 负责管理 bot 的守卫行为，包括开始和停止守卫。
 * 该实现忠实于 t.js/guard.js 的原始需求和行为。
 */
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { goals } = require('mineflayer-pathfinder')
const Movements = require('mineflayer-pathfinder').Movements

export class GuardManager {
  /**
   * @param {import('mineflayer').Bot} bot
   */
  constructor(bot) {
    this.bot = bot
    this.guardPos = null
    this.movingToGuardPos = false
  }

  /**
   * 开始守卫当前位置或指定玩家位置
   * @param {import('vec3').Vec3} [pos] - 守卫的目标位置，默认守卫自己当前位置
   */
  startGuard(pos) {
    this.guardPos = pos || this.bot.entity.position.clone()
    if (!this.bot.pvp.target) this.moveToGuardPos()
    this.bot.chat('已开始守卫')
  }

  /**
   * 停止守卫
   */
  async stopGuard() {
    this.movingToGuardPos = false
    this.guardPos = null
    if (this.bot.pvp) await this.bot.pvp.stop()
    this.bot.chat('已停止守卫')
  }

  /**
   * 移动到守卫位置
   * @private
   */
  async moveToGuardPos() {
    if (this.movingToGuardPos || !this.guardPos) return
    const mcData = require('minecraft-data')(this.bot.version)
    this.bot.pathfinder.setMovements(new Movements(this.bot, mcData))
    try {
      this.movingToGuardPos = true
      await this.bot.pathfinder.goto(new goals.GoalNear(this.guardPos.x, this.guardPos.y, this.guardPos.z, 2))
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
    if (this.bot.entity.position.distanceTo(this.guardPos) < 16) {
      const filter = e =>
        (e.type === 'hostile' || e.type === 'mob') &&
        e.position.distanceTo(this.bot.entity.position) < 10 &&
        e.displayName !== 'Armor Stand'
      entity = this.bot.nearestEntity(filter)
    }

    if (entity && !this.movingToGuardPos) {
      this.bot.pvp.attack(entity)
    } else {
      if (this.bot.entity.position.distanceTo(this.guardPos) < 2) return
      if (this.bot.pvp) await this.bot.pvp.stop()
      this.moveToGuardPos()
    }
  }
}