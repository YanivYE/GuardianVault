import AbstractView from "./AbstractView.js";

export default class SignupView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Signup");
    }

    async getHtml() {
        try {
            const response = await fetch('/signup');
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
                await import("../scripts/signup.js");
                this.scriptLoaded = true;
            } catch (error) {
                console.error('Error loading script:', error);
            }
        }
    }
}