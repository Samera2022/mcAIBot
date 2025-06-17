class Version{
    constructor(isReleased, edition, time, content){
        this.isReleased = isReleased;
        this.edition = edition;
        this.time = time;
        this.content = content;
    }
    get isReleased(){return this.isReleased}
    get edition(){return this.edition}
    get time(){return this.time}
    get content(){return this.content}
}