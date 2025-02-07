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
    const defaultMove = new Movements(bot)

    bot.on('chat', function (username, message) {
		console.log('event chat was active!');
        if (username === bot.username) return
		var walk = false;
        var target = bot.players[username] ? bot.players[username].entity : null
        if (message === 'come here') {
            walk = true;
		} else if (message === 'follow me') {
			bool_follow = true;
		} else if (message === 'stop follow me'){
			bool_follow = false;
		}
		if (walk || bool_follow){
			if (!target) {
                bot.chat('I don\'t see you !')
                return
            }
            var p = target.position

            bot.pathfinder.setMovements(defaultMove)
            bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1),true)
		}
    });
	
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
		//跟随玩家
        new StateTransition({
            parent: followPlayer,
            child: lookAtPlayer,
            // shouldTransition: () => followPlayer.distanceToTarget() < 2 || (!bool_follow),
            shouldTransition: () => followPlayer.distanceToTarget() < 5 || (!bool_follow),
        }),

        // If the distance to the player is more than two blocks, switch from the lookAtPlayer
        // state to the followPlayer state.
		//看着玩家
        new StateTransition({
            parent: lookAtPlayer,
            child: followPlayer,
            shouldTransition: () => lookAtPlayer.distanceToTarget() >= 5 || bool_follow ,
        }),
    ];

    // Now we just wrap our transition list in a nested state machine layer. We want the bot
    // to start on the getClosestPlayer state, so we'll specify that here.
    const rootLayer = new NestedStateMachine(transitions, getClosestPlayer);

    // We can start our state machine simply by creating a new instance.
    new BotStateMachine(bot, rootLayer);
})


function distanceCalc(p1, p2){
	return ((p1.x-p2.x)^2+(p1.y-p2.y)^2+(p1.z-p2.z)^2)^0.5;
}

 
