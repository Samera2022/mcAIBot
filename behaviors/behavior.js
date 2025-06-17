
// // 不要试图往下写了，这玩意存在很大问题。

// // const mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
// // import { mineflayer_pathfinder_1 } from 'mineflayer-pathfinder';
// import pkg from 'mineflayer-pathfinder';
// const { mineflayer_pathfinder_1} = pkg;
// const Movements = pkg.Movements;

// // const { goals } = require('mineflayer-pathfinder')
// // const pathfinder = require('mineflayer-pathfinder').pathfinder
// // const Movements = require('mineflayer-pathfinder').Movements


// let bool_fightOrFlight = true;//true为战斗，false为逃跑
// //改变该值的逻辑，之后再说吧


// /**
//  * Causes the bot to follow the target entity.
//  *
//  * This behavior relies on the mineflayer-pathfinding plugin to be installed.
//  */
// class BehaviorTest {

//     constructor(bot, targets) {
//         this.stateName = 'cleverFollowEntity';
//         this.active = false;
//         /**
//            * How close to the entity should the bot attempt to get?
//            */
//         this.followDistance = 0;
//         this.bot = bot;
//         this.targets = targets;
//         this.movements = new mineflayer_pathfinder_1.Movements(this.bot, this.mcData);
//     }
//     onStateEntered() {
//         this.startMoving();
//     }
//     onStateExited() {
//         this.stopMoving();
//     }
//     /**
//        * Sets the target entity this bot should follow. If the bot
//        * is currently following another entity, it will stop following
//        * that entity and follow this entity instead.
//        *
//        * If the bot is not currently in this behavior state, the entity
//        * will still be assigned as the target entity when this state is
//        * entered.
//        *
//        * Calling this method will update the targets object.
//        *
//        * @param entity - The entity to follow.
//        */
//     setFollowTarget(entity) {
//         if (this.targets.entity === entity) {
//             return;
//         }
//         this.targets.entity = entity;
//         this.restart();
//     }
//     /**
//        * Cancels the current path finding operation.
//        */
//     stopMoving() {
//         const pathfinder = this.bot.pathfinder;
//         pathfinder.setGoal(null);
//     }
//     /**
//        * Starts a new path finding operation.
//        */
//     startMoving() {
//         const entity = this.targets.entity;
//         if (entity == null)
//             return;
//         const nearbyEntities = Object.values(this.bot.entities)
//         .filter(e => (e.type === 'hostile' || e.type === 'mob') && e.position.distanceTo(this.bot.entity.position) < 16||e.position.distanceTo(entity.position) < 16);

//         nearbyEntities.forEach(entity => {
//       if (!this.obstacles.has(entity.id)) {
//         //fight or flight的具体判断，结合血量等条件还应该有其他逻辑判断
//         if (bot.entity.position.distanceTo(entity.position) > 8) return;//超过8格那就优先赶到玩家那里
//         if (bool_fightOrFlight){
//             this.bot.chat('Hostile Entity Detected! Fighting...');
//             this.bot.pvp.attack(entity);
//             this.bot.pvp.stop();
//         } 
//     }
//     });

//         const pathfinder = this.bot.pathfinder;
//         const goal = new mineflayer_pathfinder_1.goals.GoalFollow(entity, this.followDistance);
//         pathfinder.setMovements(this.movements);
//         pathfinder.setGoal(goal, true);
//         this.avoidanceInterval = setInterval(() => this.dynamicAvoidance(), 2000);
//     }
//     /**
//        * Stops and restarts this movement behavior. Does nothing if
//        * this behavior is not active.
//        *
//        * Useful if the target entity is updated while this behavior
//        * is still active.
//        */
//     restart() {
//         if (!this.active) {
//             return;
//         }
//         this.stopMoving();
//         this.startMoving();
//     }
//     /**
//        * Gets the distance to the target entity.
//        *
//        * @returns The distance, or 0 if no target entity is assigned.
//        */
//     distanceToTarget() {
//         const entity = this.targets.entity;
//         if (entity == null)
//             return 0;
//         return this.bot.entity.position.distanceTo(entity.position);
//     }
// }
// export default BehaviorTest = BehaviorTest;
