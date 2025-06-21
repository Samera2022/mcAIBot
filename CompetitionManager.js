/**
 * CompetitionManager 负责管理 bot 的比赛（切磋）行为，包括开始和停止比赛。
 * 该实现忠实于 t.js 的原始需求和行为。
 */
export class CompetitionManager {
  /**
   * @param {import('mineflayer').Bot} bot
   */
  constructor(bot) {
    this.bot = bot
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
      this.bot.chat('等等，我话还没说完呢......')
      return
    }
    const target = username
      ? this.bot.players[username]?.entity
      : this._getFirstPlayerEntity()
    if (!target) {
      this.bot.chat('未找到比赛目标')
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
    if (this.bot.pvp) this.bot.pvp.stop()
    if (this.bot.pathfinder) this.bot.pathfinder.setGoal(null)
    this.bot.chat('比赛已停止')
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
    if (this.bot.pvp) this.bot.pvp.stop()
    if (this.bot.pathfinder) this.bot.pathfinder.setGoal(null)
    if (this.playerDeath === 3 || this.botDeath === 3) {
      this.isCompeting = false
      this.competitionActive = false
      this.botDeath = 0
      this.playerDeath = 0
      this.playerName = ''
      this.boolWin = false
      this.bot.chat('怎么样，还想再来一轮吗？')
      return
    }
    await this._speaker('等你一会来拉开距离，对决马上开始......')
    const entity_target = this.bot.players[this.playerName]?.entity
    if (entity_target) {
      if (this.bot.pvp) this.bot.pvp.attack(entity_target)
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
    this.bot.chat(str)
    await new Promise(resolve => setTimeout(resolve, 250 * str.length))
  }

  /**
   * 处理死亡事件（需在 bot.on('entityDead') 里调用）
   * @param {object} entity
   */
  async onEntityDead(entity) {
    if (!this.competitionActive) return
    if (entity.type === 'player') {
      if (entity.username === this.bot.username) {
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
    for (const name in this.bot.players) {
      if (name !== this.bot.username && this.bot.players[name].entity) {
        return this.bot.players[name].entity
      }
    }
    return null
  }
}