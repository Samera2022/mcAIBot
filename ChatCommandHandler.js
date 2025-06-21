export class ChatCommandHandler {
  /**
   * @param {import('mineflayer').Bot} bot
   * @param {object} modules
   * @param {import('./BlockManager.js').BlockManager} modules.blockWorker
   * @param {any} [modules.stateManager]
   * @param {any} [modules.pvpManager]
   * @param {any} [modules.guardManager]
   * @param {any} [modules.competitionManager]
   */
  constructor(bot, modules) {
    this.bot = bot
    this.blockManager = modules.blockManager
    this.stateManager = modules.stateManager
    this.pvpManager = modules.pvpManager
    this.guardManager = modules.guardManager
    this.competitionManager = modules.competitionManager

    // 指令映射表
    this.commandMap = {
      'D10': async () => await this.blockManager.handleD10(),
      'D11': async () => await this.blockManager.handleD11(),
      '跟随': async () => {
        this.bot.chat('开始跟随')
        if (this.stateManager && this.stateManager.startFollow) {
          this.stateManager.startFollow()
        }
      },
      '停止跟随': async () => {
        this.bot.chat('停止跟随')
        if (this.stateManager && this.stateManager.stopFollow) {
          this.stateManager.stopFollow()
        }
      },
      'pvp': async () => {
        this.bot.chat('开始PVP')
        if (this.pvpManager && this.pvpManager.startPvp) {
          this.pvpManager.startPvp()
        }
      },
      'stop': async () => {
        this.bot.chat('停止当前工作')
        if (this.stateManager && this.stateManager.stopAll) {
          this.stateManager.stopAll()
        }
        if (this.pvpManager && this.pvpManager.stopPvp) {
          this.pvpManager.stopPvp()
        }
        if (this.guardManager && this.guardManager.stopGuard) {
          this.guardManager.stopGuard()
        }
        if (this.competitionManager && this.competitionManager.stopCompetition) {
          this.competitionManager.stopCompetition()
        }
      },
      '守卫': async () => {
        this.bot.chat('开始守卫')
        if (this.guardManager && this.guardManager.startGuard) {
          this.guardManager.startGuard()
        }
      },
      '比赛': async () => {
        this.bot.chat('开始比赛')
        if (this.competitionManager && this.competitionManager.startCompetition) {
          this.competitionManager.startCompetition()
        }
      }
    }

    this.bot.on('chat', this.handleChat.bind(this))
  }

  /**
   * 聊天指令分发
   * @param {string} username
   * @param {string} message
   */
  async handleChat(username, message) {
    if (username === this.bot.username) return
    const handler = this.commandMap[message]
    if (handler) {
      await handler()
    }
  }
}