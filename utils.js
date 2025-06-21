/**
 * 判断方块是否为流体（水或岩浆）
 * @param {Block} block
 * @returns {boolean}
 */
export function isFluid(block) {
  if (!block) return false
  return block.name.includes('water') || block.name.includes('lava')
}

/**
 * 等待指定时间
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 等待指定位置的方块发生变化并满足条件
 * @param {Bot} bot
 * @param {Vec3} pos
 * @param {(newBlock: Block) => boolean} filterFn
 * @param {number} timeout
 * @returns {Promise<Block>}
 */
export function waitBlockUpdate(bot, pos, filterFn = () => true, timeout = 3000) {
  return new Promise(resolve => {
    const listener = (oldBlock, newBlock) => {
      if (newBlock.position.equals(pos) && filterFn(newBlock)) {
        bot.removeListener('blockUpdate', listener)
        resolve(newBlock)
      }
    }
    bot.on('blockUpdate', listener)
    setTimeout(() => {
      bot.removeListener('blockUpdate', listener)
      resolve(bot.blockAt(pos))
    }, timeout)
  })
}

/**
 * 逆向推导offset（-1,0,1），使其与D9的分割逻辑一致
 * @param {Vec3} fluidPos
 * @param {Vec3} botPos
 * @returns {{dx: number, dy: number, dz: number}}
 */
export function RCToOffset(fluidPos, botPos) {
  let dx = 0, dz = 0
  const baseX = Math.floor(botPos.x)
  const baseZ = Math.floor(botPos.z)

  if (fluidPos.x === baseX - 1) dx = -1
  else if (fluidPos.x === baseX + 1) dx = 1

  if (fluidPos.z === baseZ - 1) dz = -1
  else if (fluidPos.z === baseZ + 1) dz = 1

  const dy = fluidPos.y - Math.floor(botPos.y)
  return { dx, dy, dz }
}

/**
 * 判断输入的正负性
 * @param {number} input
 * @returns {number}
 */
export function judgeSign(input) {
  if (input > 0) return 1
  else if (input < 0) return -1
  else return 0
}