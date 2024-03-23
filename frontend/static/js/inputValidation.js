export default class InputValidation 
{
    constructor() {
        this.alertMessageBox;
    }
  
    setMessageBox(message)
    {
        this.alertMessageBox = message;
    }

    errorAlert(alertMessage)
    {
        this.alertMessageBox.style.color = "red";
        this.alertMessageBox.innerText = alertMessage;
        this.alertMessageBox.style.display = "block";
    }

    generalInputValidation(input) {
        if (this.validateEmptyInput(input)) {
            this.errorAlert("Fill out all input fields.");
            return false;
        }
        if (this.validateInputLength(input)) {
            this.errorAlert("Input must not be longer than 30 characters.");
            return false;
        }
        if (this.validateScriptTags(input)) {
            this.errorAlert("Input must not contain any <script> tags.");
            return false;
        }
        if (this.validateQuotationMarks(input)) {
            this.errorAlert("Input must not contain any quotation marks(`'\").")
            return false;
        }
        return true;    
    }           

    validateEmptyInput(input)
    {
        return input.trim() === '';
    }

    validateInputLength(input) {
        return input.length > 30;
    }

    validateScriptTags(input) {
        const regex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

        // Check if the input contains script tags
        return regex.test(input);
    }

    validateQuotationMarks(input)
    {
        const regex = /['"`]/; // Regex to match invalid characters: ', ", `
        return regex.test(input);
    }

    validateEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if(!regex.test(email))
        {
            this.errorAlert("Invalid Email address.");
            return false;
        }
        return true;
    }

    validatePasswordStrength(strengthText)
    {
        if(strengthText !== 'Strong' && strengthText !== 'Excellent!')
        {
            this.errorAlert("Password strength must be at least Strong.");
            return false;
        }
        return true;
    }
}