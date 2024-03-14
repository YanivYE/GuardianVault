import AbstractView from "./AbstractView.js";

export default class DownloadView extends AbstractView{
  constructor() {
    super();
    this.setTitle("Download");
  }

  async getHtml() {
    try {
        const response = await fetch('/download');
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
                await import("../scripts/download.js");
                this.scriptLoaded = true;
            } catch (error) {
                console.error('Error loading script:', error);
            }
        }
    }
}