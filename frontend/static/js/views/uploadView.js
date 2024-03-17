import AbstractView from "./AbstractView.js";

export default class UploadView extends AbstractView{
  constructor() {
    super();
    this.setTitle("Upload");
  }

  async getHtml() {
    try {
        const response = await fetch('/upload');
        const html = await response.text();
        return html;
    } catch (error) {
        console.error('Error fetching HTML:', error);
        return null; // or handle the error accordingly
    }
  }
}