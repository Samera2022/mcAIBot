import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const mineflayer = require('mineflayer')
const { goals } = require('mineflayer-pathfinder')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
const pvp = require('mineflayer-pvp').plugin
import { loader as autoEat } from 'mineflayer-auto-eat'
const { Vec3 } = require('vec3')
const EventEmitter = require('events')
const toolPlugin = require('mineflayer-tool').plugin
const armorManager = require('mineflayer-armor-manager')

// 自定义模块
import { BlockManager } from './BlockManager.js'
import { StateManager } from './StateManager.js'
import { PVPManager } from './PVPManager.js'
import { GuardManager } from './GuardManager.js'
import { CompetitionManager } from './CompetitionManager.js'
import { ChatCommandHandler } from './ChatCommandHandler.js'

console.log('running...')

// 创建 bot 实例
export const bot = mineflayer.createBot({
  host: '127.0.0.1',
  username: 'CappieTest',
  port: 25565
})

// 插件加载
bot.loadPlugin(pvp)
bot.loadPlugin(pathfinder)
bot.loadPlugin(toolPlugin)
bot.loadPlugin(armorManager)

// 事件监听
bot.once('spawn', () => {
  mineflayerViewer(bot, { port: 3007, firstPerson: true })
  bot.armorManager.equipAll()
})

// 自动进食
bot.once('spawn', async () => {
  bot.loadPlugin(autoEat)
  bot.autoEat.enableAuto()
  bot.autoEat.on('eatStart', (opts) => { console.log(`Started eating ${opts.food.name} in ${opts.offhand ? 'offhand' : 'hand'}`) })
  bot.autoEat.on('eatFinish', (opts) => { console.log(`Finished eating ${opts.food.name}`) })
  bot.autoEat.on('eatFail', (error) => { console.error('Eating failed:', error) })
})

// 错误与踢出日志
bot.on('kicked', console.log)
bot.on('error', console.log)

// 实例化功能模块
const blockManager = new BlockManager(bot)
const stateManager = new StateManager(bot)
const pvpManager = new PVPManager(bot)
const guardManager = new GuardManager(bot)
const competitionManager = new CompetitionManager(bot)

// 聊天指令处理（D10/D11/跟随/PVP/守卫/比赛/stop等）
new ChatCommandHandler(bot, {
  blockManager,
  stateManager,
  pvpManager,
  guardManager,
  competitionManager
})

// 守卫与比赛相关事件绑定
bot.on('entityDead', (entity) => {
  guardManager.onStoppedAttacking()
  competitionManager.onEntityDead(entity)
})
bot.on('physicsTick', () => {
  guardManager.onPhysicsTick()
})

// 你可以根据需要继续扩展其它事件和功能