import { Vec3 } from 'vec3'
import { isFluid, judgeSign, sleep } from './utils.js'
import { bot, lang } from './botMain.js'

export class BlockManager {

    /**
     * 获取相对位置的方块
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Block|null}
     */
    getRelativeBlock(x, y, z) {
        return bot.blockAt(bot.entity.position.offset(x, y, z))
    }

    /**
     * 判断背包是否有可放置方块
     * @returns {Item|null}
     */
    getPlaceableBlock() {
        const mcData = require('minecraft-data')(bot.version)
        return bot.inventory.items().find(item => {
            const b = mcData.items[item.type]
            return b && b.name !== 'water_bucket' && b.name !== 'lava_bucket' && b.stackSize > 1
        }) || null
    }

    /**
     * 智能放置方块：自动检测依附面，尝试在目标位置放置方块
     * @param {Vec3} targetPos
     * @returns {Promise<boolean>}
     */
    async placeBlock(targetPos) {
        const placeableBlock = this.getPlaceableBlock()
        if (!placeableBlock) {
            bot.chat(lang.t('warn.block.not_enough'))
            return false
        }
        await bot.equip(placeableBlock, 'hand')

        const directions = [
            new Vec3(1, 0, 0), new Vec3(-1, 0, 0),
            new Vec3(0, 1, 0), new Vec3(0, -1, 0),
            new Vec3(0, 0, 1), new Vec3(0, 0, -1)
        ]

        for (const dir of directions) {
            const attachBlock = bot.blockAt(targetPos.offset(dir.x, dir.y, dir.z))
            if (attachBlock && attachBlock.boundingBox === 'block' && !isFluid(attachBlock)) {
                try {
                    await bot.placeBlock(attachBlock, dir.scaled(-1))
                    return true
                } catch (e) {
                    continue
                }
            }
        }
        return false
    }

    /**
     * 挖掘指定方块
     * @param {Block} block
     * @returns {Promise<boolean>}
     */
    async removeBlock(block) {
        if (block && block.hardness > 0) {
            try {
                await bot.dig(block)
                return true
            } catch (e) {
                bot.chat(lang.t('warn.block.not_enough', e))
            }
        }
        return false
    }

    /**
     * 精确检测并填充目标 block 附近的流体
     * @param {Vec3} blockPos - 目标 block 的位置
     * @param {number} arrLen - D10/D11 中 arr 的长度
     */
    async fillNearbyFluids(blockPos, arrLen) {
        const directions4 = [
            new Vec3(1, 0, 0),  // 右
            new Vec3(-1, 0, 0), // 左
            new Vec3(0, 0, 1),  // 前
            new Vec3(0, 0, -1)  // 后
        ]
        const directions6 = [
            ...directions4,
            new Vec3(0, 1, 0),  // 上
            new Vec3(0, -1, 0)  // 下
        ]

        // arrLen 决定检测方式
        let targets = []

        if (arrLen === 4) {
            // 计算 block 相对 bot 的象限
            const botPos = bot.entity.position
            const dx = Math.round(blockPos.x - botPos.x)
            const dz = Math.round(blockPos.z - botPos.z)
            if ((dx * dz) != 0) {
                targets = [blockPos.offset(dx, 0, 0), blockPos.offset(0, 0, dz)]
            }
            // 其它情况（如正前、正后、正左、正右），可根据需要补充
            else {
                // 默认取四个方向
                targets = directions4.map(dir => blockPos.offset(dir.x, dir.y, dir.z))
            }
        } else if (arrLen === 2) {
            // 六个方向
            targets = directions6.map(dir => blockPos.offset(dir.x, dir.y, dir.z))
        } else if (arrLen === 1) {
            // 四个方向
            targets = directions4.map(dir => blockPos.offset(dir.x, dir.y, dir.z))
        }

        // 检查并填充流体
        for (const pos of targets) {
            const neighbor = bot.blockAt(pos)
            if (neighbor && isFluid(neighbor)) {
                await fillFluid(neighbor.position)
            }
        }
    }

    /**
     * 填充单个流体
     * @param {Vec3} pos
     * @returns {Promise<void>}
     */
    async fillFluid(pos) {
        let placeableBlock = this.getPlaceableBlock()
        if (!placeableBlock) {
            bot.chat(lang.t('warn.block.not_enough'))
            return
        }
        await bot.equip(placeableBlock, 'hand')
        let placed = await this.placeBlock(pos)
        if (!placed) {
            await this.placeBlock(pos.offset(0, -1, 0))
        }
    }

    /**
     * D10 指令：优先处理脚下及相邻流体方块
     */
    async handleD10() {
        let arr = []
        const pos = bot.entity.position
        let x = Math.floor(pos.x)
        let z = Math.floor(pos.z)
        let deltaX = 0, deltaZ = 0
        arr.push(this.getRelativeBlock(0, -1, 0))
        const xFrac = pos.x - x
        if (xFrac < 0.3) deltaX = -1
        else if (xFrac >= 0.7) deltaX = 1
        if (deltaX !== 0) arr.push(this.getRelativeBlock(deltaX, -1, 0))
        const zFrac = pos.z - z
        if (zFrac < 0.3) deltaZ = -1
        else if (zFrac >= 0.7) deltaZ = 1
        if (deltaZ !== 0) arr.push(this.getRelativeBlock(0, -1, deltaZ))
        if ((deltaX * deltaZ) !== 0) {
            arr.push(this.getRelativeBlock(deltaX, -1, deltaZ))
        }
        arr = arr.filter(b => b)
        arr.sort((a, b) => {
            // 优先流体
            if (isFluid(a) && !isFluid(b)) return -1
            if (!isFluid(a) && isFluid(b)) return 1
            return 0
        })
        for (const block of arr) {
            if (isFluid(block)) {
                await this.fillFluid(block.position)
            } else {
                await this.removeBlock(block)
            }
        }
    }

    async chopTree() {
        // 1. 找到最近的原木
        const logBlock = bot.findBlock({
            matching: block => block && block.name.endsWith('_log'),
            maxDistance: 16
        })
        if (!logBlock) {
            bot.chat(lang.t('warn.block.ct.not_found'))
            return
        }

        // 2. 广度优先/深度优先查找所有相连原木
        const visited = new Set()
        const logs = []
        const stack = [logBlock.position]
        while (stack.length) {
            const pos = stack.pop()
            const key = `${pos.x},${pos.y},${pos.z}`
            if (visited.has(key)) continue
            visited.add(key)
            const block = bot.blockAt(pos)
            if (block && block.name.endsWith('_log')) {
                logs.push(pos)
                // 检查6个方向
                for (const dir of [
                    new Vec3(1, 0, 0), new Vec3(-1, 0, 0),
                    new Vec3(0, 1, 0), new Vec3(0, -1, 0),
                    new Vec3(0, 0, 1), new Vec3(0, 0, -1)
                ]) {
                    stack.push(pos.plus(dir))
                }
            }
        }

        // 3. 从下到上排序（可选）
        logs.sort((a, b) => a.y - b.y)

        // 4. 依次挖掘
        for (const pos of logs) {
            const block = bot.blockAt(pos)
            if (block) await bot.dig(block)
        }
        bot.chat(lang.t('info.block.ct.finished'))
    }
}