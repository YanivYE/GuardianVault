import AbstractView from "./AbstractView.js";

export default class LoginView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Login");
    }

    async getHtml() {
        try {
            const response = await fetch('/login');
            const html = await response.text();
            return html;
        } catch (error) {
            console.error('Error fetching HTML:', error);
            return null; // or handle the error accordingly
        }
    }

    async loadScript() {
        if (!this.scriptLoaded) {
            try {
                await import("../scripts/login.js");
                this.scriptLoaded = true;
            } catch (error) {
                console.error('Error loading script:', error);
            }
        }
    }
}