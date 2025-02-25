//写在前面
//不要对机器人整很多逆天操作，这个机器人的逻辑判断很脆弱的（（（
//也不要试图多人同时使用一个机器人，也会出bug的
//@author: Samera2022
//@date: 2025.02.07 17:24
//@ts-check


import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mineflayer = require('mineflayer')
const { goals } = require('mineflayer-pathfinder')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
const pvp = require('mineflayer-pvp').plugin
import { loader as autoEat } from 'mineflayer-auto-eat'

const EventEmitter = require('events');
const emitter = new EventEmitter();
emitter.setMaxListeners(50);//just for test

const { StateTransition, BotStateMachine, EntityFilters, BehaviorFollowEntity, BehaviorLookAtEntity, BehaviorGetClosestEntity,
  NestedStateMachine } = require("mineflayer-statemachine");

import behaviorOnWork from './behaviorOnWork.js';
import { str_OW_FISHING, str_OW_COLLECTING_BLOCKS, str_OW_GUARDING, str_OW_PVP, str_OW_COMPETE, str_OW_STOP_ALL_ACTIVITIES } from './constant.js';
import { str_R_FOLLOW, str_R_FOLLOW_ENDED, str_R_PVP, str_R_GUARD, str_R_COMPETE } from './constant.js';
import { stopGuarding, evt_stoppedAttacking, evt_physicsTick } from './guard.js';

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


var object_compete = {
  int_compete: 0,
  int_bot_death: 0,
  int_player_death: 0,
  str_player: '',
  bool_win: false, /*bot是否胜利*/
  bool_compete: false
}

bot.once('spawn', () => {

  const targets = {};
  const getClosestPlayer = new BehaviorGetClosestEntity(bot, targets, EntityFilters().PlayersOnly);
  const followPlayer = new BehaviorFollowEntity(bot, targets);
  const lookAtPlayer = new BehaviorLookAtEntity(bot, targets);
  const onWork = new behaviorOnWork(bot, targets);
  const transitions = [
    //找玩家0
    new StateTransition({
      parent: getClosestPlayer,
      child: followPlayer,
      shouldTransition: () => true,
    }),
    //从跟转到看1
    new StateTransition({
      parent: followPlayer,
      child: lookAtPlayer,
      shouldTransition: () => followPlayer.distanceToTarget() < 2,
    }),
    //从看转到跟2
    new StateTransition({
      parent: lookAtPlayer,
      child: followPlayer,
      shouldTransition: () => lookAtPlayer.distanceToTarget() >= 2 && bool_follow,
    }),
    //从看转为工作3
    new StateTransition({
      parent: lookAtPlayer,
      child: onWork,
      shouldTransition: () => bool_onWork,
    }),
    //从跟转为工作4
    new StateTransition({
      parent: followPlayer,
      child: onWork,
      shouldTransition: () => bool_onWork,
    }),
    //从工作转为看5
    new StateTransition({
      parent: onWork,
      child: lookAtPlayer,
      shouldTransition: () => (!bool_onWork),
    })
  ];
  const rootLayer = new NestedStateMachine(transitions, getClosestPlayer);
  new BotStateMachine(bot, rootLayer);
  var infos = {};//全局变量
  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;
    var entity_target = bot.players[username] ? bot.players[username].entity : null
    infos.sender = username;//发送者已确定
    var bool_currentOnWork = bool_onWork;//判断事件发生时是否处于onWork状态
    const defaultMove = new Movements(bot)

    //R(Request)表示请求，变量判断请求类型时使用
    //OW(onWork)表示工作种类，在判断出请求类型之后传递参数时使用。二者大抵是可以合并掉一大部分的，但是之后再说吧。
    //目前bot还无法做到一心多用（（（一次只能干一件事
    //WARN: 如果之后做到了一心多用的话，那么这里的switch case判断逻辑就要换成一条一条if来判断了
    switch (message) {
      case str_R_FOLLOW:
        if (!validateHorizon(entity_target)) return;
        transitions[5].trigger();
        transitions[2].trigger();
        bool_follow = true;
        break;
      case str_R_FOLLOW_ENDED:
        transitions[1].trigger()
        bool_follow = false;
        break;
      //WARN
      //WARN
      //WARN
      //WARN
      //WARN
      //WARN
      //WARN
      //WARN      此处状态机的切换仍然有问题，多加注意！
      //WARN      应该先切换状态再进行寻路之类的操作的
      //WARN
      //WARN
      //WARN
      //WARN
      //WARN
      //WARN
      //WARN
      //WARN
      //接下来的case都涉及工作状态的转变  
      case str_R_PVP:
        if (!validateHorizon(entity_target)) return;
        bool_onWork = true;
        trigger(true)
        bot.chat('Let\'s see who is the boss of the Gym♂!')
        infos.workType = str_OW_PVP
        break;
      case str_R_GUARD:
        if (!validateHorizon(entity_target)) return;
        bool_onWork = true;
        trigger(true);
        bot.chat('I will guard that location.')
        infos.workType = str_OW_GUARDING
        break;


      case str_R_COMPETE:
        if (!validateHorizon(entity_target)) return;
        bool_onWork = true;
        trigger(false);
        bool_onWork = false;
        // const p = entity_target.position
        // bot.pathfinder.setMovements(defaultMove)
        // await bot.pathfinder.goto(new goals.GoalNear(p.x, p.y, p.z, 1))
        object_compete.str_player = username;
        if (!object_compete.bool_compete) await compete();
        else bot.chat('等等，我话还没说完呢......');
        break;

    }

    //转为工作状态onWork，同时传递参数
    function trigger(bool_addInfo) {
      if (bool_onWork) {
        if (!bool_currentOnWork) {
          transitions[0].trigger();
          transitions[3].trigger();
          transitions[4].trigger();
        }
        if (bool_addInfo) onWork.addInfo(infos);
      }
    }

    //如果发送了停止消息那么就开始判断要停止什么。目前bot还无法做到一心多用（（（一次只能干一件事
    //如果玩家发送了stop，且onWork有具体的任务，且已经进入了onWork状态（或许可以忽略三者中后面二者中的其中一条判断？）
    //WARN: 如果之后做到了一心多用的话，那么这里的switch case判断逻辑就要换成一条一条if来判断了
    console.log('[CHECK]: ' + '\nonWork.targets.workType: ' + onWork.targets.workType + '\nbool_onWork: ' + bool_onWork);
    //onWork.targets.workType只能获取当前chat事件下的workType，无法通过onWork.targets.workType来获取bot所处的工作类型
    //后记：onWork的targets无法获取，，，我不知道为什么在当前chat事件里是可以获取的，在下一个chat事件就获取不了了
    if (message === 'stop' && infos.workType !== undefined && (bool_onWork)) {
      switch (infos.workType) {
        case str_OW_PVP:
          bot.pvp.stop();
          bot.pathfinder.setGoal(null)
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
  //WARN: bot如果之前是follow状态，死亡重生之后就会回到刚刚的地点，但我不清楚这是为什么
  bot.on('spawn', () => {
    if (bool_onWork && infos.workType !== undefined) {
      transitions[3].trigger();
      transitions[4].trigger();
    };
    if (object_compete.bool_compete) {
      object_compete.bool_win = false;
      object_compete.int_bot_death += 1;
      compete();
    }
    if (bool_follow) {
      transitions[2].trigger();
    }
  });

  bot.on('entityDead', (entity) => {
    if (entity.type === 'player') {
      if (entity.username === bot.username) return;
      if (object_compete.bool_compete && object_compete.str_player === entity.username) {
        object_compete.bool_win = true;
        object_compete.int_player_death += 1;
        compete();
      }
    }
  })

  bot.on('entityHurt', (entity) => {
    if (entity.type === 'player') {
      if (infos.workType !== str_OW_PVP && (!object_compete.bool_compete)) {
        if (entity.username === bot.username) {
          bot.chat('I\'m hurt!');
        } else {
          bot.chat('How do you feel? Is that hurt?');
        }
      }
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
// bot.on('stoppedAttacking', evt_stoppedAttacking);
bot.on('entityDead', evt_stoppedAttacking);

const armorManager = require("mineflayer-armor-manager");
bot.loadPlugin(armorManager);
bot.once("spawn", () => bot.armorManager.equipAll());


bot.once('spawn', async () => {
  bot.loadPlugin(autoEat)
  bot.autoEat.enableAuto()
  bot.autoEat.on('eatStart', (opts) => { console.log(`Started eating ${opts.food.name} in ${opts.offhand ? 'offhand' : 'hand'}`) })
  bot.autoEat.on('eatFinish', (opts) => { console.log(`Finished eating ${opts.food.name}`) })
  bot.autoEat.on('eatFail', (error) => { console.error('Eating failed:', error) })
})

function sleep(ms) { return new Promise(val => setTimeout(val, ms)); }

async function compete() {
  object_compete.bool_compete = true;
  var str_object = '';
  if (object_compete.int_player_death === 0 && object_compete.int_bot_death === 0) str_object = '0v0';
  else if (object_compete.bool_win) {
    str_object += 'v' + object_compete.int_player_death;
  } else {
    str_object += object_compete.int_bot_death + 'v';
  }
  await handle_compete(str_object);
  bot.pvp.stop();
  bot.pathfinder.setGoal(null);
  if (object_compete.int_player_death === 3 || object_compete.int_bot_death === 3) {
    object_compete = {
      int_compete: 0,
      int_bot_death: 0,
      int_player_death: 0,
      str_player: '',
      bool_win: false,
      bool_compete: false
    };
    bot.chat('怎么样，还想再来一轮吗？');
    return;
  }
  await speaker('等你一会来拉开距离，对决马上开始......');
  var entity_target = bot.players[object_compete.str_player] ? bot.players[object_compete.str_player].entity : null;
  //@ts-ignore
  if (validateHorizon(entity_target)) bot.pvp.attack(entity_target);
}

//没有增加玩家对话的原因是因为我不知道怎么整（（（而且从逻辑上来说好像机器人是没办法做出这种效果的（
async function handle_compete(object) {
  var objectMap = {
    //player v bot
    '0v0': async function () {
      await speaker('你是说想和我来一场切磋吗？');
      await speaker('太好了！我已经很久没有找人切磋过了！');
      await speaker('那么我先来说明一下规则！');
      await speaker('以你的视角来看，屏幕右边应该会出现一些Object对象,,,,,,');
      await speaker('噢！不好意思');
      await speaker('我忘记你不能直接看Object对象了！等我一会......');
      await speaker('大功告成！现在你应该就可以看得懂了！');
      await speaker('右边列出了我的失败次数和你的失败次数');
      await speaker('我们以三局为界，三局两胜！');
      await speaker('怎么样，有意思吧！');
      await speaker('我们先来试试吧！');
    },
    'v1': async function () {
      await speaker('还行吗？还行的话就继续吧！');
    },
    'v2': async function () {
      await speaker('看我的！');
      await speaker('知道我的厉害了吧！');
    },
    'v3': async function () {
      await speaker('哈哈！');
      await speaker('我真棒！');
      await speaker('我真可爱！');
    },
    '1v': async function () {
      await speaker('你啊！');
      await speaker('OK，');
      await speaker('我会狠狠报仇的！');
    },
    '2v': async function () {
      await speaker('怎么又输了？');
      await speaker('我没事，咱们继续吧！');
      await speaker('你赢了。');
    },
    '3v': async function () {
      await speaker('这么厉害的吗......');
      await speaker('现在你是我最尊敬的对手了！');
    }
  }
  return objectMap[object]();
}
async function speaker(str) {
  bot.chat(str)
  await sleep(250 * (str.length));
}
// bot.on('chat', async (username, message) => {
//   if (username === bot.username) return;
//   if (message === 'Dig downwards') {
//     const blockPos = bot.entity.position.offset(0, -1, 0)
//     const block = bot.blockAt(blockPos)
//     await bot.tool.equipForBlock(block, () => { bot.equip(mcdata.items(), 'hand'); })
//     await bot.dig(block)
//   }
// })