import { bot, lang } from './botMain.js'
import { blockManager, stateManager, pvpManager, guardManager, competitionManager } from './botMain.js'

export class ChatCommandHandler {
  constructor() {

    // 指令映射表
    this.commandMap = {
      [lang.t('cmd.chat.D10')]: async () => await blockManager.handleD10(),
      [lang.t('cmd.chat.ct')]: async () => await blockManager.chopTree(),
      [lang.t('cmd.chat.follow')]: async () => {
        if (stateManager && stateManager.startFollow) {
          stateManager.startFollow()
        }
      },
      [lang.t('cmd.chat.stop_following')]: async () => {
        if (stateManager && stateManager.stopFollow) {
          stateManager.stopFollow()
        }
      },
      [lang.t('cmd.chat.pvp')]: async () => {
        if (pvpManager && pvpManager.startPvp) {
          pvpManager.startPvp()
        }
      },
      [lang.t('cmd.chat.stop')]: async () => {
        bot.chat(lang.t('info.chat.stop'))
        if (stateManager && stateManager.stopAll) {
          stateManager.stopAll()
        }
        if (pvpManager && pvpManager.stopPvp) {
          pvpManager.stopPvp()
        }
        if (guardManager && guardManager.stopGuard) {
          guardManager.stopGuard()
        }
        if (competitionManager && competitionManager.stopCompetition) {
          competitionManager.stopCompetition()
        }
      },
      [lang.t('cmd.chat.guard')]: async () => {
        if (guardManager && guardManager.startGuard) {
          guardManager.startGuard()
        }
      },
      [lang.t('cmd.chat.compete')]: async () => {
        if (competitionManager && competitionManager.startCompetition) {
          competitionManager.startCompetition()
        }
      }
    }

    bot.on('chat', this.handleChat.bind(this))
  }

  /**
   * 聊天指令分发
   * @param {string} username
   * @param {string} message
   */
  async handleChat(username, message) {
    if (username === bot.username) return
    const handler = this.commandMap[message]
    if (handler) {
      await handler()
    }
  }
}