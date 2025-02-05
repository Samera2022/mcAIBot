import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mineflayer = require('mineflayer')

console.log('running...');

const bot = mineflayer.createBot({
    host: 'play.simpfun.cn', // minecraft 服务器的 IP 地址
    username: 'CappieTest', // minecraft 用户名
    //password: '12345678' // minecraft 密码, 如果你玩的是不需要正版验证的服务器，请注释掉。
    port: 13425,                // 默认使用 25565，如果你的服务器端口不是这个请取消注释并填写。
    // version: false,             // 如果需要指定使用一个版本或快照时，请取消注释并手动填写（如："1.8.9" 或 "1.16.5"），否则会自动设置。
    // auth: 'mojang'              // 如果需要使用微软账号登录时，请取消注释，然后将值设置为 'microsoft'，否则会自动设置为 'mojang'。
})

const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
bot.once('spawn', () => {
    mineflayerViewer(bot, { port: 3007, firstPerson: true }) // port 是本地网页运行的端口 ，如果 firstPerson: false，那么将会显示鸟瞰图。
})

// 记录错误和被踢出服务器的原因:
bot.on('kicked', console.log)
bot.on('error', console.log)

const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear } = require('mineflayer-pathfinder').goals
bot.loadPlugin(pathfinder)
bot.loadPlugin(require('mineflayer-pathfinder').pathfinder);
const {
    StateTransition,
    BotStateMachine,
    EntityFilters,
    BehaviorFollowEntity,
    BehaviorLookAtEntity,
    BehaviorGetClosestEntity,
    NestedStateMachine } = require("mineflayer-statemachine");

var bool_follow = false;
bot.once('spawn', () => {
    // This targets object is used to pass data between different states. It can be left empty.
    const targets = {};
    // Create our states
    const getClosestPlayer = new BehaviorGetClosestEntity(bot, targets, EntityFilters().PlayersOnly);
    const followPlayer = new BehaviorFollowEntity(bot, targets);
    const lookAtPlayer = new BehaviorLookAtEntity(bot, targets);
    // Create our transitions
    const transitions = [
        // We want to start following the player immediately after finding them.
        // Since getClosestPlayer finishes instantly, shouldTransition() should always return true.
        //找玩家
        new StateTransition({
            parent: getClosestPlayer,
            child: followPlayer,
            shouldTransition: () => true,
        }),
        // If the distance to the player is less than two blocks, switch from the followPlayer
        // state to the lookAtPlayer state.
        //从跟转到看
        new StateTransition({
            parent: followPlayer,
            child: lookAtPlayer,
            // shouldTransition: () => followPlayer.distanceToTarget() < 2,
            shouldTransition: () => followPlayer.distanceToTarget() < 2,
        }),
        // If the distance to the player is more than two blocks, switch from the lookAtPlayer
        // state to the followPlayer state.
        //从看转到跟
        new StateTransition({
            parent: lookAtPlayer,
            child: followPlayer,
            // shouldTransition: () => lookAtPlayer.distanceToTarget() >= 2,
            shouldTransition: () => lookAtPlayer.distanceToTarget() >= 2 && bool_follow,
        }),
    ];
    const rootLayer = new NestedStateMachine(transitions, getClosestPlayer);
    new BotStateMachine(bot, rootLayer);
    bot.on('chat', function (username, message) {
		console.log('event chat was active!');
        if (username === bot.username) return
        var target = bot.players[username] ? bot.players[username].entity : null
        if (!target) {
            bot.chat('I don\'t see you !')
            return
        }
        if (message === 'follow me') {
            transitions[2].trigger()
            bool_follow = true;
        } else if (message === 'stop following me'){
			transitions[1].trigger()
            bool_follow = false;
		}
    });
})

const { goals } = require('mineflayer-pathfinder')
const pvp = require('mineflayer-pvp').plugin
bot.loadPlugin(pvp)
//pvp
bot.on('chat', (username, message) => {
  if (message === 'fight me') {
    const player = bot.players[username]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.pvp.attack(player.entity)
  }

  if (message === 'stop') {
    bot.pvp.stop()
  }
})
let guardPos = null
let movingToGuardPos = false

// Assign the given location to be guarded
function guardArea (pos) {
  guardPos = pos

  // We are not currently in combat, move to the guard pos
  if (!bot.pvp.target) {
    moveToGuardPos()
  }
}

// Cancel all pathfinder and combat
async function stopGuarding () {
  movingToGuardPos = false
  guardPos = null
  await bot.pvp.stop()
}

// Pathfinder to the guard position
async function moveToGuardPos () {
  // Do nothing if we are already moving to the guard position
  if (movingToGuardPos) return
  // console.info('Moving to guard pos')
  const mcData = require('minecraft-data')(bot.version)
  bot.pathfinder.setMovements(new Movements(bot, mcData))
  try {
    movingToGuardPos = true
    // Wait for pathfinder to go to the guarding position
    await bot.pathfinder.goto(new goals.GoalNear(guardPos.x, guardPos.y, guardPos.z, 2))
    movingToGuardPos = false
  } catch (err) {
    // Catch errors when pathfinder is interrupted by the pvp plugin or if pathfinder cannot find a path
    movingToGuardPos = false
    // console.warn(err)
    // console.warn('Mineflayer-pvp encountered a pathfinder error')
  }
}

// Called when the bot has killed it's target.
bot.on('stoppedAttacking', () => {
  if (guardPos) {
    moveToGuardPos()
  }
})

// Check for new enemies to attack
bot.on('physicsTick', async () => {
  if (!guardPos) return // Do nothing if bot is not guarding anything

  let entity = null
  // Do not attack mobs if the bot is to far from the guard pos
  if (bot.entity.position.distanceTo(guardPos) < 16) {
      // Only look for mobs within 16 blocks
      const filter = e => (e.type === 'hostile' || e.type === 'mob') && e.position.distanceTo(bot.entity.position) < 10 && e.displayName !== 'Armor Stand' // Mojang classifies armor stands as mobs for some reason?
      entity = bot.nearestEntity(filter)
  }
  
  if (entity != null && !movingToGuardPos) {
    // If we have an enemy and we are not moving back to the guarding position: Start attacking
    bot.pvp.attack(entity)
  } else {
    // If we do not have an enemy or if we are moving back to the guarding position do this:
    // If we are close enough to the guarding position do nothing
    if (bot.entity.position.distanceTo(guardPos) < 2) return
    // If we are too far stop pvp and move back to the guarding position
    await bot.pvp.stop()
    moveToGuardPos()
  }
})

// Listen for player commands
bot.on('chat', (username, message) => {
  // Guard the location where the player is standing
  if (message === 'guard') {
    const player = bot.players[username]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.chat('I will guard that location.')
    // Copy the players Vec3 position and guard it
    guardArea(player.entity.position.clone())
  }

  // Stop guarding
  if (message === 'stop') {
    bot.chat('I will no longer guard this area.')
    stopGuarding()
  }
})

//set model
bot.once('spawn', () => {
    bot.chat('/ysm model set CappieTest mita_miside texture true');
})

bot.on('entityHurt', (entity)=>{
    if (entity.type==='player') {
        if (entity.username===bot.username) {
            bot.chat('I\'m hurt!');
        } else {
            bot.chat('How do you feel? Is that hurt?');
        }
    }
})

bot.on('entityDead', (entity)=>{
    if (entity.type==='player'){
        if (entity.username!==bot.username) {
            bot.chat('Oh, dear!');
        }
    }
})

const armorManager = require("mineflayer-armor-manager");
bot.loadPlugin(armorManager);
bot.once("spawn", () => bot.armorManager.equipAll());

import { loader as autoEat } from 'mineflayer-auto-eat'
bot.once('spawn', async () => {
    bot.loadPlugin(autoEat)
    bot.autoEat.enableAuto()

    bot.autoEat.on('eatStart', (opts) => {
        console.log(`Started eating ${opts.food.name} in ${opts.offhand ? 'offhand' : 'hand'}`)
    })

    bot.autoEat.on('eatFinish', (opts) => {
        console.log(`Finished eating ${opts.food.name}`)
    })

    bot.autoEat.on('eatFail', (error) => {
        console.error('Eating failed:', error)
    })
})

bot.on('chat', async (username, message) => {
    if (username===bot.username) return;
    if (message==='Dig downwards') {
    const blockPos = bot.entity.position.offset(0, -1, 0)
    const block = bot.blockAt(blockPos)
    await bot.tool.equipForBlock(block, ()=>{bot.equip(mcdata.items(),'hand');})
    await bot.dig(block)
   }
})