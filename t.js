import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mineflayer = require('mineflayer')
const { goals } = require('mineflayer-pathfinder')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear } = require('mineflayer-pathfinder').goals
const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
const pvp = require('mineflayer-pvp').plugin

const { StateTransition, BotStateMachine, EntityFilters, BehaviorFollowEntity, BehaviorLookAtEntity, BehaviorGetClosestEntity,
  NestedStateMachine } = require("mineflayer-statemachine");

import behaviorOnWork from './behaviorOnWork.js';
import { str_OW_FISHING, str_OW_COLLECTING_BLOCKS, str_OW_GUARDING, str_OW_PVP, str_OW_STOP_ALL_ACTIVITIES } from './constant.js';
import { str_R_FOLLOW, str_R_FOLLOW_ENDED, str_R_PVP, str_R_GUARD } from './constant.js';
import { stopGuarding, evt_stoppedAttacking, evt_physicsTick} from './guard.js';

console.log('running...');

export const bot = mineflayer.createBot({
  host: 'play.simpfun.cn', // minecraft 服务器的 IP 地址
  username: 'CappieTest', // minecraft 用户名
  //password: '12345678' // minecraft 密码, 如果你玩的是不需要正版验证的服务器，请注释掉。
  port: 13425,                // 默认使用 25565，如果你的服务器端口不是这个请取消注释并填写。
  // version: false,             // 如果需要指定使用一个版本或快照时，请取消注释并手动填写（如："1.8.9" 或 "1.16.5"），否则会自动设置。
  // auth: 'mojang'              // 如果需要使用微软账号登录时，请取消注释，然后将值设置为 'microsoft'，否则会自动设置为 'mojang'。
})

bot.loadPlugin(pvp)
bot.loadPlugin(pathfinder)

bot.once('spawn', () => { mineflayerViewer(bot, { port: 3007, firstPerson: true }) /* port 是本地网页运行的端口 ，如果 firstPerson: false，那么将会显示鸟瞰图。*/ })

// 记录错误和被踢出服务器的原因:
bot.on('kicked', console.log)
bot.on('error', console.log)

var bool_follow = false;/*用来判断是否处在跟随玩家的状态*/
var bool_onWork = false;/*用来判断是否处在工作的状态*/

bot.once('spawn', () => {

  const targets = {};
  const getClosestPlayer = new BehaviorGetClosestEntity(bot, targets, EntityFilters().PlayersOnly);
  const followPlayer = new BehaviorFollowEntity(bot, targets);
  const lookAtPlayer = new BehaviorLookAtEntity(bot, targets);
  const onWork = new behaviorOnWork(bot, targets);
  const transitions = [
    //找玩家
    new StateTransition({
      parent: getClosestPlayer,
      child: followPlayer,
      shouldTransition: () => true,
    }),
    //从跟转到看
    new StateTransition({
      parent: followPlayer,
      child: lookAtPlayer,
      shouldTransition: () => followPlayer.distanceToTarget() < 2,
    }),
    //从看转到跟
    new StateTransition({
      parent: lookAtPlayer,
      child: followPlayer,
      shouldTransition: () => lookAtPlayer.distanceToTarget() >= 2 && bool_follow,
    }),
    //从看转为工作
    new StateTransition({
      parent: lookAtPlayer,
      child: onWork,
      shouldTransition: () => bool_onWork,
    }),
    //从跟转为工作
    new StateTransition({
      parent: followPlayer,
      child: onWork,
      shouldTransition: () => bool_onWork,
    }),
    //从工作转为看
    new StateTransition({
      parent: onWork,
      child: lookAtPlayer,
      shouldTransition: () => (!bool_onWork),
    })
  ];
  const rootLayer = new NestedStateMachine(transitions, getClosestPlayer);
  new BotStateMachine(bot, rootLayer);
  var infos = {};//全局变量
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    var entity_target = bot.players[username] ? bot.players[username].entity : null
    infos.sender = username;//发送者已确定
    var bool_currentOnWork = bool_onWork;//判断事件发生时是否处于onWork状态

    //R(Request)表示请求，变量判断请求类型时使用
    //OW(onWork)表示工作种类，在判断出请求类型之后传递参数时使用。二者大抵是可以合并掉一大部分的，但是之后再说吧。
    //目前bot还无法做到一心多用（（（一次只能干一件事
    //WARN: 如果之后做到了一心多用的话，那么这里的switch case判断逻辑就要换成一条一条if来判断了
    switch (message) {
      case str_R_FOLLOW:
        if (!validateHorizon(entity_target)) return;
        transitions[2].trigger();
        transitions[5].trigger();
        bool_follow = true;
        break;
      case str_R_FOLLOW_ENDED:
        transitions[1].trigger()
        bool_follow = false;
        break;

      //接下来的case都涉及工作状态的转变  
      case str_R_PVP:
        if (!validateHorizon(entity_target)) return;
        bot.chat('Let\'s see who is the boss of the Gym♂!')
        infos.workType = str_OW_PVP
        bool_onWork = true;
        break;
      case str_R_GUARD:
        if (!validateHorizon(entity_target)) return;
        bot.chat('I will guard that location.')
        infos.workType = str_OW_GUARDING
        bool_onWork = true;
        break;  
    }

    //转为工作状态onWork，同时传递参数
    if (bool_onWork) {
      if (!bool_currentOnWork){
        transitions[3].trigger();
        transitions[4].trigger();
      }
      onWork.addInfo(infos);
    }

    //如果发送了停止消息那么就开始判断要停止什么。目前bot还无法做到一心多用（（（一次只能干一件事
    //如果玩家发送了stop，且onWork有具体的任务，且已经进入了onWork状态（或许可以忽略三者中后面二者中的其中一条判断？）
    //WARN: 如果之后做到了一心多用的话，那么这里的switch case判断逻辑就要换成一条一条if来判断了
    console.log('[CHECK]: '+'\nonWork.targets.workType: '+onWork.targets.workType+'\nbool_onWork: '+bool_onWork);
    //onWork.targets.workType只能获取当前chat事件下的workType，无法通过onWork.targets.workType来获取bot所处的工作类型
    //后记：onWork的targets无法获取，，，我不知道为什么在当前chat事件里是可以获取的，在下一个chat事件就获取不了了
    if (message === 'stop' && infos.workType !== undefined && (bool_onWork)) {
      switch (infos.workType) {
        case str_OW_PVP:
          bot.pvp.stop();
          break;
        case str_OW_GUARDING:
          bot.chat('I will no longer guard this area.')
          stopGuarding();
          break;
        default:
          console.log('[ERROR] WorkType Unknown!');
          break;  
      }
      infos.workType = undefined;    
      bool_onWork = false;//工作已停止
      transitions[5].trigger();//状态由工作转换为原地看着
    }
  })
})

function validateHorizon(entity_target) {
  if (!entity_target) {
    bot.chat('I don\'t see you !')
    return false
  } else return true
}

bot.on('physicsTick', evt_physicsTick);
bot.on('stopAttacking', evt_stoppedAttacking);

//set model
bot.once('spawn', () => {
  bot.chat('/ysm model set CappieTest mita_miside texture true');
})

bot.on('entityHurt', (entity) => {
  if (entity.type === 'player') {
    if (entity.username === bot.username) {
      bot.chat('I\'m hurt!');
    } else {
      bot.chat('How do you feel? Is that hurt?');
    }
  }
})

bot.on('entityDead', (entity) => {
  if (entity.type === 'player') {
    if (entity.username !== bot.username) {
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
  bot.autoEat.on('eatStart', (opts) => {console.log(`Started eating ${opts.food.name} in ${opts.offhand ? 'offhand' : 'hand'}`)})
  bot.autoEat.on('eatFinish', (opts) => {console.log(`Finished eating ${opts.food.name}`)})
  bot.autoEat.on('eatFail', (error) => {console.error('Eating failed:', error)})
})

// bot.on('chat', async (username, message) => {
//   if (username === bot.username) return;
//   if (message === 'Dig downwards') {
//     const blockPos = bot.entity.position.offset(0, -1, 0)
//     const block = bot.blockAt(blockPos)
//     await bot.tool.equipForBlock(block, () => { bot.equip(mcdata.items(), 'hand'); })
//     await bot.dig(block)
//   }
// })