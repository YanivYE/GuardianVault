import AbstractView from "./AbstractView.js";

export default class CodeVerificationView extends AbstractView{
    constructor() {
        super();
        this.setTitle("Code Verification");
    }

    async getHtml() {
        try {
            const response = await fetch('/codeVerification');
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
                await import("../scripts/codeVerification.js");
                this.scriptLoaded = true;
            } catch (error) {
                console.error('Error loading script:', error);
            }
        }
    }
}