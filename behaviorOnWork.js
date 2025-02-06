import { str_OW_FISHING, str_OW_COLLECTING_BLOCKS, str_OW_GUARDING, str_OW_PVP, str_OW_STOP_ALL_ACTIVITIES } from './constant.js';
import { guardArea } from './guard.js';

var targets;

class behaviorOnWork {

    constructor(bot, targets) {
        this.bot = bot;
        this.active = false;
        this.stateName = 'onWork';
        this.targets = targets;
    }

    onStateEntered() {
        const bot = this.bot;
        const sender = this.targets.sender;
        const workType = this.targets.workType;
        const player_sender = bot.players[sender];
        console.log(`${bot.username} has entered the ${this.stateName} state.`);
        console.log('sender: ' + sender + '; workType: ' + workType);
        switch (workType) {
            case str_OW_FISHING:
                break;
            case str_OW_COLLECTING_BLOCKS:
                break;
            case str_OW_GUARDING:
                guardArea(player_sender.entity.position.clone());
                break;
            case str_OW_PVP:
                bot.pvp.attack(player_sender.entity)
                break;
        }
    };

    update() {
        //相当于while true
    }

    currentWorkType(){return this.targets.workType}
    setWorkType(_workType){this.targets.workType = _workType}

    addInfo(infos) {
        // this.infos = infos;
        if (this.targets.sender === undefined || this.targets.sender !== infos.sender) this.targets.sender = infos.sender;
        if (this.targets.workType === undefined || this.targets.workType !== infos.workType) this.targets.workType = infos.workType;
    }

    onStateExited() {
        const bot = this.bot;
        console.log(`${bot.username} has left the ${this.stateName} state.`);
    }

}
export default behaviorOnWork = behaviorOnWork;