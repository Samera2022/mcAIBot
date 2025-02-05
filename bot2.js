const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;
const armorManager = require('mineflayer-armor-manager');
const toolPlugin = require('mineflayer-tool').plugin;
const autoeat = require('mineflayer-auto-eat').plugin;
const collectBlock = require('mineflayer-collectblock').plugin;
const { GoalFollow } = require('mineflayer-pathfinder').goals
var navigatePlugin = require('mineflayer-navigate')(mineflayer);
var scaffoldPlugin = require('mineflayer-scaffold')(mineflayer);
const inventoryViewer = require('mineflayer-web-inventory')
const mineflayerViewer = require('prismarine-viewer').mineflayer

const bot = mineflayer.createBot({
    //host: 'mcyly.top',
    host: '82zpyas.nat.ipyingshe.com',
    port: 38182,
    username: 'ImHuman',
    version: '1.12.2'

});
bot.loadPlugin(require('mineflayer-dashboard'))
navigatePlugin(bot);
scaffoldPlugin(bot);
bot.loadPlugin(pathfinder);
bot.loadPlugin(pvp);
bot.loadPlugin(armorManager);
bot.loadPlugin(toolPlugin);
bot.loadPlugin(autoeat);
bot.loadPlugin(collectBlock);
/*
bot.on('spawn', () => {
    bot.chat('Hello, I am a bot. You can chat with me to control me.');
});
*/
mineflayerViewer(bot, { port: 3001, firstPerson: true })
inventoryViewer(bot)
var options = {
    host: '127.0.0.1', // optional
    port: 3000,         // optional
}
bot.on('chat', (username, message) => { // 监听chat事件
    if (username === bot.username) return // 忽略自己发的消息
    console.log(message) // 输出消息
    if (message.includes('加入')) { // 如果消息包含组队
        bot.chat('/msg ' + username + ' 你好！')
        bot.chat('/party accept ' + username) // 输入命令
    }
})
bot.on('chat', (username, message) => { // 监听chat事件
    if (username === bot.username) return // 忽略自己发的消息
    console.log(message) // 输出消息
    if (message.includes('邀请')) { // 如果消息包含组队
        bot.chat('/msg ' + username + ' ok')
        bot.chat('/party invite ' + username) // 输入命令
    }
})
let followPlayer = null;

bot.on('chat', (username, message) => {
    if (username.includes('zztzz')) {
        if (message.includes('give me')) {
            bot.chat('/msg ' + username + ' Here you go!');
            bot.inventory.items().forEach(item => {
                bot.tossStack(item);

            });
        }

        if (message.includes('stop')) {
            bot.chat('/msg ' + username + ' Ok, I am stopping.');
            bot.pathfinder.setGoal(null);

        }
    }
});

bot.on('playerCollect', (collector, itemDrop) => {
    if (collector !== bot.entity) return;
    setTimeout(() => {
        const sword = bot.inventory.items().find(item => item.name.includes('sword'));
        if (sword) bot.equip(sword, 'hand');
    }, 150)
});
// Listen for player commands
bot.on('chat', (username, message) => {
    // 新增判断条件
    if (message.includes('sword')) {
        // 获取背包中的剑
        const sword = bot.inventory.items().find(item => item.name.includes('sword'));
        // 如果有剑
        if (sword) {
            // 回复消息
            bot.chat(`/msg ${username} ok, I will equip a sword!`);
            // 装备剑到主手
            bot.equip(sword, 'hand');
        } else {
            // 回复消息
            bot.chat(`/msg ${username} sorry, I don't have a sword.`);
        }
    }
})

bot.on('playerCollect', (collector, itemDrop) => {
    if (collector !== bot.entity) return;
    setTimeout(() => {
        const shield = bot.inventory.items().find(item => item.name.includes('shield'));
        if (shield) bot.equip(shield, 'off-hand');
    }, 250)
});

bot.on('spawn', () => {
    function moveToGuardPos() {
        const mcData = require('minecraft-data')(bot.version);
        bot.pathfinder.setMovements(new Movements(bot, mcData));
        bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z));
    }
});
bot.on('stoppedAttacking', () => {
    if (guardPos) {
        moveToGuardPos();
    }
});

bot.on('physicsTick', () => {
    if (bot.pvp.target) return;
    if (bot.pathfinder.isMoving()) return;

    const entity = bot.nearestEntity();
    if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0));
});

bot.on('physicsTick', () => {
    if (!guardPos) return;

    const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16 &&
        e.mobType !== 'Armor Stand';

    const entity = bot.nearestEntity(filter);
    if (entity) {
        bot.pvp.attack(entity);
    }
});
let guardPos = null

// Assign the given location to be guarded
function guardArea(pos) {
    guardPos = pos

    // We we are not currently in combat, move to the guard pos
    if (!bot.pvp.target) {
        moveToGuardPos()
    }
}

// Cancel all pathfinder and combat
function stopGuarding() {
    guardPos = null
    bot.pvp.stop()
    bot.pathfinder.setGoal(null)
}

// Pathfinder to the guard position
function moveToGuardPos() {
    bot.pathfinder.setMovements(new Movements(bot))
    bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
}

// Called when the bot has killed it's target.
bot.on('stoppedAttacking', () => {
    if (guardPos) {
        moveToGuardPos()
    }
})

// Check for new enemies to attack
bot.on('physicsTick', () => {
    if (!guardPos) return // Do nothing if bot is not guarding anything

    // Only look for mobs within 16 blocks
    const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16 &&
        e.mobType !== 'Armor Stand' // Mojang classifies armor stands as mobs for some reason?

    const entity = bot.nearestEntity(filter)
    if (entity) {
        // Start attacking
        bot.pvp.attack(entity)
    }
})

// Listen for player commands
bot.on('chat', (username, message) => {
    if (username.includes('zztzz')) {
        if (message.includes('guard')) {
            bot.pathfinder.setGoal(null);
            const player = bot.players[username]

            if (!player) {
                bot.chat("/msg " + username + " I can't see you.")
                return
            }

            bot.chat('/msg ' + username + ' I will guard that location.')
            guardArea(player.entity.position)
        }

        if (message.includes('fight me')) {
            bot.pathfinder.setGoal(null);
            //bot.chat('/pvp')
            bot.chat('/msg ' + username + ' ok,来吧!')
            const player = bot.players[username]

            if (!player) {
                bot.chat("/msg " + username + " I can't see you.")
                return
            }

            bot.chat('/msg ' + username + ' Prepare to fight!')
            bot.pvp.attack(player.entity)
        }

        if (message.includes('fight them')) {
            bot.pathfinder.setGoal(null);
            // 获取最近的玩家实体
            const filter = e => e.type === 'player' && e.username !== bot.username && e.username !== 'zztzz';
            const player = bot.nearestEntity(filter);
            // 如果存在玩家实体
            if (player) {
                // 回复消息
                bot.chat(`/msg ${username} ok, I will fight them!`);
                // 开始攻击
                bot.pvp.attack(player);
            } else {
                // 回复消息
                bot.chat(`/msg ${username} I can't see any other players.`);
            }
        }
        if (message.includes('fight player:')) {
            bot.pathfinder.setGoal(null);
            const targetUsername = message.split(':')[1]; // 通过分割字符串获取攻击目标用户名
            const filter = e => e.type === 'player' && e.username !== bot.username && e.username === targetUsername; // 根据攻击目标用户名构建筛选器
            const player = bot.nearestEntity(filter);
            if (player) {
                bot.chat(`/msg ${username} ok, I will fight ${targetUsername}!`);
                bot.pvp.attack(player);
            } else {
                bot.chat(`/msg ${username} I can't see ${targetUsername}.`);
            }
        }
        if (message.includes('stop')) {
            bot.chat('/msg ' + username + ' I will no longer guard this area.')
            stopGuarding()
        }
    }
})
//process.on('uncaughtException', console.log)

bot.once('spawn', () => {

    const defaultMove = new Movements(bot)
    bot.on('chat', function (username, message) {
        if (username.includes('zztzz')) {
            if (username === bot.username) return
            if (message.includes('follow me')) {
                const target = bot.players[username] ? bot.players[username].entity : null
                if (!target) {
                    bot.chat('/msg ' + username + ' I don\'t see you !')
                    return
                }
                bot.pathfinder.setMovements(defaultMove)
                bot.pathfinder.setGoal(new GoalFollow(target, 2), true) // 跟随目标，保持3个方块的距离
            }

            const followCommand = 'follow player:'

            if (message.includes(followCommand)) {
                const target = bot.players[message.substr(followCommand.length)] ? bot.players[message.substr(followCommand.length)].entity : null
                // 根据消息中的指令获取跟随的玩家名称
                if (!target) {
                    bot.chat('/msg ' + username + ' I don\'t see the player!') // 如果找不到该玩家就反馈信息给发送者
                    return
                }

                bot.pathfinder.setMovements(defaultMove)
                bot.pathfinder.setGoal(new GoalFollow(target, 2), true) // 跟随目标，保持3个方块的距离
            }

            if (message.includes('stop')) {
                bot.pathfinder.setGoal(null) // 停止跟随
            }
        }
    })
})

var blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
bot.loadPlugin(blockFinderPlugin);

function moveToBlock(block, done) {

    var mcData = require('minecraft-data')(bot.version);

    var canDigFunction = function (block) {

        return block.type !== mcData.blocksByName.bedrock.id && block.type !== mcData.blocksByName.obsidian.id;
    };

    var costFunction = function (node, neighbor) {

        var blockType = bot.blockAt(neighbor.position).type;

        if (blockType === mcData.blocksByName.air.id || blockType === mcData.blocksByName.water.id) {
            return 1;
        }

        return defaultMove.cost(node, neighbor);
    };

    var customMove = new Movements(bot, mcData, canDigFunction, costFunction);

    var target = { x: block.position.x, y: block.position.y, z: block.position.z };
    var GoalBlock = require('mineflayer-pathfinder').goals.GoalBlock;

    bot.pathfinder.goto(new GoalBlock(target.x, target.y, target.z), { timeout: Infinity }, function (err) {
        if (err) {

            console.log('/msg ' + ' There was an error: ' + err);

            bot.pathfinder.resetPath();
            bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1));
            return;
        }

        bot.chat('/msg ' + username + ' I moved to the block at ' + target + '.');
        return done();
    });
}

bot.on('chat', function (username, message) {

    if (username === bot.username) return;
    if (username.includes('zztzz')) {
        if (message.includes('diamond')) {

            bot.findBlock({
                point: bot.entity.position,
                matching: 56,
                maxDistance: 256,
                count: 1,
            }, function (err, blocks) {
                if (err) {
                    bot.chat('/msg ' + username + ' Error trying to find diamond ore: ' + err);
                    return;
                }
                if (blocks.length) {

                    var target = blocks[0];
                    bot.chat('/msg ' + username + ' I found a diamond ore block at ' + target.position + '.');

                    moveToBlock(target, function (err) {
                        if (err) {
                            bot.chat('/msg ' + username + ' There was an error moving to the diamond ore: ' + err);
                            return;
                        }

                        bot.dig(target, function (err) {
                            if (err) {
                                bot.chat('/msg ' + username + ' There was an error digging the diamond ore: ' + err);
                                return;
                            }

                            bot.chat('/msg ' + username + ' Successfully mined the diamond ore!');
                            return;
                        });
                    });

                } else {

                    bot.chat("/msg " + username + " I couldn't find any diamond ore blocks within 256.");
                    return;
                }
            });
        }
    }
});

bot.on('chat', function (username, message) {

    if (username === bot.username) return;
    if (username.includes('zztzz')) {
        if (message.includes('wood')) {
            bot.chat('/msg ' + username + ' 我在找木头！')
            bot.findBlock({
                point: bot.entity.position,
                matching: 17,
                maxDistance: 256,
                count: 1,
            }, function (err, blocks) {
                if (err) {
                    bot.chat('/msg ' + username + ' Error trying to find wood ore: ' + err);
                    return;
                }
                if (blocks.length) {

                    var target = blocks[0];
                    bot.chat('/msg ' + username + ' I found a wood ore block at ' + target.position + '.');

                    moveToBlock(target, function (err) {
                        if (err) {
                            bot.chat('/msg ' + username + ' There was an error moving to the wood ore: ' + err);
                            return;
                        }

                        bot.dig(target, function (err) {
                            if (err) {
                                bot.chat('/msg ' + username + ' There was an error digging the wood ore: ' + err);
                                return;
                            }

                            bot.chat('/msg ' + username + ' Successfully mined the wood ore!');
                            return;
                        });
                    });
                } else {

                    bot.chat("/msg " + username + " I couldn't find any wood ore blocks within 256.");
                    return;
                }
            });

        }
        if (message.includes('iron')) {
            bot.chat('/msg ' + username + ' 我在找铁！')
            bot.findBlock({
                point: bot.entity.position,
                matching: 15,
                maxDistance: 256,
                count: 1,
            }, function (err, blocks) {
                if (err) {
                    bot.chat('/msg ' + username + ' Error trying to find iron ore: ' + err);
                    return;
                }
                if (blocks.length) {

                    var target = blocks[0];
                    bot.chat('/msg ' + username + ' I found a iron block at ' + target.position + '.');

                    moveToBlock(target, function (err) {
                        if (err) {
                            bot.chat('/msg ' + username + ' There was an error moving to the iron ore: ' + err);
                            return;
                        }

                        bot.dig(target, function (err) {
                            if (err) {
                                bot.chat('/msg ' + username + ' There was an error digging the iron ore: ' + err);
                                return;
                            }

                            bot.chat('/msg ' + username + ' Successfully mined the iron ore!');
                            return;
                        });
                    });
                } else {

                    bot.chat("/msg " + username + " I couldn't find any wood ore blocks within 256.");
                    return;
                }
            });
        }
    }



});
//mc.owenbedwars.top
bot.on('chat', function (username, message) {
    // 忽略自己发出的消息
    if (username === bot.username) return;
    // 检查消息是否包含"坐标"这个词
    if (message.includes('坐标')) {
        console.log('发坐标到' + username)
        // 获取机器人当前的位置
        var position = bot.entity.position;
        // 将位置转换为整数坐标
        var x = Math.floor(position.x);
        var y = Math.floor(position.y);
        var z = Math.floor(position.z);
        // 发送一条消息，格式为 我的坐标是: x, y, z
        bot.chat('/msg ' + username + ' 我的坐标是: ' + x + ', ' + y + ', ' + z);
    }
});
bot.on('chat', (username, message) => {

    if (message.includes('please tpa')) {
        // 发送"/party accept ztzzz"指令
        bot.chat('/msg ' + username + ' I will try accept')
        bot.chat('/tpa ' + username)
    }
    if (message.includes('tpahere')) {
        bot.chat('/msg ' + username + ' I will try')
        bot.chat('/tpahere ' + username)
    }


})
bot.on('chat', (username, message) => {

    if (message.includes('friend')) {
        // 发送"/party accept ztzzz"指令
        bot.chat('/friend add ' + username)

    }



})
bot.on('chat', (username, message) => {
    // 打印消息内容
    console.log(username + ': ' + message)

})
// 定义一个变量来存储主手原来拿的物品
let originalItem = null;

// 当需要吃食物时，触发autoeat_started事件
bot.on('autoeat_started', (item, offhand) => {
    // 打印日志信息
    console.log(`Eating ${item.name} in ${offhand ? 'offhand' : 'hand'}`);
    // 如果不是在副手吃食物
    if (!offhand) {
        // 获取主手拿的物品
        originalItem = bot.heldItem;
        // 如果主手拿的物品不是食物
        if (originalItem !== item) {
            // 禁用自动吃食物功能，避免冲突
            bot.autoEat.disableAutoEat();
            // 将食物装备到主手
            bot.equip(item, 'hand', (err) => {
                // 如果出错，打印错误信息
                if (err) console.error(err);
                // 否则，重新启用自动吃食物功能
                else bot.autoEat.enableAutoEat();
            });
        }
    }
});

// 当吃完食物时，触发autoeat_finished事件
bot.on('autoeat_finished', (item, offhand) => {
    // 打印日志信息
    console.log(`Finished eating ${item.name} in ${offhand ? 'offhand' : 'hand'}`);
    // 如果不是在副手吃食物，并且有原来拿的物品
    if (!offhand && originalItem) {
        // 禁用自动吃食物功能，避免冲突
        bot.autoEat.disableAutoEat();
        // 将原来拿的物品装备到主手
        bot.equip(originalItem, 'hand', (err) => {
            // 如果出错，打印错误信息
            if (err) console.error(err);
            // 否则，重新启用自动吃食物功能，并将原来拿的物品置空
            else {
                bot.autoEat.enableAutoEat();
                originalItem = null;
            }
        });
    }
});

// 当出现错误时，触发autoeat_error事件

// 监听玩家zztzz的消息

