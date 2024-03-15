import AbstractView from "./AbstractView.js";

export default class ResetPasswordView extends AbstractView{
  constructor() {
    super();
    this.setTitle("Reset Password");
  }

  async getHtml() {
    try {
        const response = await fetch('/resetPassword');
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
                await import("../scripts/resetPassword.js");
                this.scriptLoaded = true;
            } catch (error) {
                console.error('Error loading script:', error);
            }
        }
    }
}