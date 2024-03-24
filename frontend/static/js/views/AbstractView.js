import InputValidation from "../inputValidation.js";

export default class AbstractView {
    constructor() {
        this.inputValidator = new InputValidation(window.client.socket);
    }

    setTitle(title) {
        document.title = title;
    }

    setMessageBox(message)
    {
        this.inputValidator.setMessageBox(message);
    }

    async getHtml() {
        return "";
    }

    async executeViewScript() {}
}