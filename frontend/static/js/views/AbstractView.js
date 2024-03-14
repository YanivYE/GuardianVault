export default class AbstractView {
    constructor() {
    }

    setTitle(title) {
        document.title = title;
    }

    async getHtml() {
        return "";
    }

    static async loadScript() {}
    
    async render() {
        await this.constructor.loadScript();
        return await this.getHtml();
    }
}