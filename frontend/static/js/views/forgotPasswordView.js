import AbstractView from "./AbstractView.js";

export default class ForgotPasswordView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Forgot Password");
    }

    async getHtml() {
        try {
            const response = await fetch('/forgotPassword');
            const html = await response.text();
            return html;
        } catch (error) {
            console.error('Error fetching HTML:', error);
            return null; // or handle the error accordingly
        }
    }

    static async loadScript() {
        if (!this.scriptLoaded) {
            try {
                await import("../scripts/forgotPassword.js");
                this.scriptLoaded = true;
            } catch (error) {
                console.error('Error loading script:', error);
            }
        }
    }
}