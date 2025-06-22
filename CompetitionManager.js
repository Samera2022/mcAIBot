import { bot, lang } from './botMain.js'
/**
 * CompetitionManager 负责管理 bot 的比赛（切磋）行为，包括开始和停止比赛。
 */
export class CompetitionManager {
  constructor() {
    this.isCompeting = false
    this.playerName = ''
    this.botDeath = 0
    this.playerDeath = 0
    this.boolWin = false
    this.competitionActive = false
  }

  /**
   * 开始比赛（切磋）
   * @param {string} [username] - 可选，指定比赛目标玩家名
   */
  async startCompetition(username) {
    if (this.competitionActive) {
      bot.chat(lang.t("info.compete.interrupted"))
      return
    }
    const target = username ? bot.players[username]?.entity : this._getFirstPlayerEntity()
    if (!target) {
      bot.chat(lang.t('warn.compete.not_found'))
      return
    }
    this.isCompeting = true
    this.competitionActive = true
    this.playerName = username || target.username
    this.botDeath = 0
    this.playerDeath = 0
    this.boolWin = false

    await this._competeLoop()
  }

  /**
   * 停止比赛
   */
  async stopCompetition() {
    this.isCompeting = false
    this.competitionActive = false
    this.playerName = ''
    if (bot.pvp) bot.pvp.stop()
    if (bot.pathfinder) bot.pathfinder.setGoal(null)
    bot.chat(lang.t('info.compete.stop'))
  }

  /**
   * 比赛主循环
   * @private
   */
  async _competeLoop() {
    let str_object = ''
    if (this.playerDeath === 0 && this.botDeath === 0) str_object = '0v0'
    else if (this.boolWin) {
      str_object += 'v' + this.playerDeath
    } else {
      str_object += this.botDeath + 'v'
    }
    await this._handleCompeteDialog(str_object)
    if (bot.pvp) bot.pvp.stop()
    if (bot.pathfinder) bot.pathfinder.setGoal(null)
    if (this.playerDeath === 3 || botDeath === 3) {
      this.isCompeting = false
      this.competitionActive = false
      this.botDeath = 0
      this.playerDeath = 0
      this.playerName = ''
      this.boolWin = false
      bot.chat(lang.t('info.compete.another_round'))
      return
    }
    await this._speaker(lang.t('info.compete.wait'))
    const entity_target = bot.players[this.playerName]?.entity
    if (entity_target) {
      if (bot.pvp) bot.pvp.attack(entity_target)
    }
  }

  /**
   * 处理比赛对话
   * @private
   */
  async _handleCompeteDialog(object) {
    const dialogMap = {
      '0v0': async () => {
        await this._speaker('你是说想和我来一场切磋吗？')
        await this._speaker('太好了！我已经很久没有找人切磋过了！')
        await this._speaker('那么我先来说明一下规则！')
        await this._speaker('以你的视角来看，屏幕右边应该会出现一些Object对象,,,,,,')
        await this._speaker('噢！不好意思')
        await this._speaker('我忘记你不能直接看Object对象了！等我一会......')
        await this._speaker('大功告成！现在你应该就可以看得懂了！')
        await this._speaker('右边列出了我的失败次数和你的失败次数')
        await this._speaker('我们以三局为界，三局两胜！')
        await this._speaker('怎么样，有意思吧！')
        await this._speaker('我们先来试试吧！')
      },
      'v1': async () => {
        await this._speaker('还行吗？还行的话就继续吧！')
      },
      'v2': async () => {
        await this._speaker('看我的！')
        await this._speaker('知道我的厉害了吧！')
      },
      'v3': async () => {
        await this._speaker('哈哈！')
        await this._speaker('我真棒！')
        await this._speaker('我真可爱！')
      },
      '1v': async () => {
        await this._speaker('你啊！')
        await this._speaker('OK，')
        await this._speaker('我会狠狠报仇的！')
      },
      '2v': async () => {
        await this._speaker('怎么又输了？')
        await this._speaker('我没事，咱们继续吧！')
        await this._speaker('你赢了。')
      },
      '3v': async () => {
        await this._speaker('这么厉害的吗......')
        await this._speaker('现在你是我最尊敬的对手了！')
      }
    }
    if (dialogMap[object]) {
      await dialogMap[object]()
    }
  }

  /**
   * 简单说话并延迟
   * @private
   */
  async _speaker(str) {
    bot.chat(str)
    await new Promise(resolve => setTimeout(resolve, 250 * str.length))
  }

  /**
   * 处理死亡事件（需在 bot.on('entityDead') 里调用）
   * @param {object} entity
   */
  async onEntityDead(entity) {
    if (!this.competitionActive) return
    if (entity.type === 'player') {
      if (entity.username === bot.username) {
        this.boolWin = false
        this.botDeath += 1
        await this._competeLoop()
      } else if (entity.username === this.playerName) {
        this.boolWin = true
        this.playerDeath += 1
        await this._competeLoop()
      }
    }
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