import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { goals } = require('mineflayer-pathfinder')
const Movements = require('mineflayer-pathfinder').Movements

let guardPos = null
let movingToGuardPos = false
import { bot } from './t.js';

// Assign the given location to be guarded
export function guardArea(pos) {
  guardPos = pos
  // We are not currently in combat, move to the guard pos
  if (!bot.pvp.target) moveToGuardPos()
}

// Cancel all pathfinder and combat
export async function stopGuarding() {
  movingToGuardPos = false
  guardPos = null
  await bot.pvp.stop()
}

// Pathfinder to the guard position
async function moveToGuardPos() {
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
export function evt_stoppedAttacking(){if (guardPos) moveToGuardPos()}

// Check for new enemies to attack
export async function evt_physicsTick(){
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
}

