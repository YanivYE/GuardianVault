import AbstractView from "./AbstractView.js";

export default class MenuView extends AbstractView{
  constructor() {
    super();
    this.setTitle("Menu");
  }

  async getHtml() {
    try {
        const response = await fetch('/menu');
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
            await import("../scripts/menu.js");
            this.scriptLoaded = true;
        } catch (error) {
            console.error('Error loading script:', error);
        }
    }
  }
}