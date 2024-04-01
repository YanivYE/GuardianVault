// Import InputValidation module
import InputValidation from "../inputValidation.js";

// AbstractView class declaration
export default class AbstractView {
    // Constructor method
    constructor() {
        // Initialize inputValidator with InputValidation instance
        this.inputValidator = new InputValidation(window.client.socket);
    }

    // Method to set document title
    setTitle(title) {
        document.title = title;
    }

    // Method to set message box
    setMessageBox(message) {
        // Call setMessageBox method of inputValidator
        this.inputValidator.setMessageBox(message);
    }

    // Asynchronous method to get HTML content
    async getHtml() {
        // Returns an empty string by default, should be overridden by subclasses
        return "";
    }

    // Asynchronous method to execute view script
    async executeViewScript() {
        // Method to be overridden by subclasses for executing view-specific scripts
    }
}
