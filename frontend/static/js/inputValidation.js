import { signatureToMIME, getMIMExtension } from "./utils.js";

export default class InputValidation 
{
    constructor(socket) {
        this.alertMessageBox;
        this.socket = socket;
    }
  
    setMessageBox(message)
    {
        this.alertMessageBox = message;
    }

    errorAlert(errorMessage) {
        this.showMessage(errorMessage, "red");
    }

    successAlert(successMessage) {
        this.showMessage(successMessage, "green");
    }

    showMessage(messageText, color) {
        this.alertMessageBox.style.display = "block";
        this.alertMessageBox.style.color = color;
        this.alertMessageBox.innerText = messageText;
    }

    generalInputValidation(input) {
        if (this.validateEmptyInput(input)) {
            this.errorAlert("Fill out all input fields.");
            return false;
        }
        if (this.validateInputLength(input)) {
            this.errorAlert("Input must not be longer than 40 characters.");
            return false;
        }
        if (this.validateScriptTags(input)) {
            this.errorAlert("Input must not contain any <script> tags.");
            this.XSSAlert(input);
            return false;
        }
        if (this.validateSqlInjectionMarks(input)) {
            this.errorAlert("Input must not contain any potential \nSQL Injection marks(`'\";).")
            this.SqliAlert(input);
            return false;
        }
        if (this.validateInvalidCharacters(input)) {
            this.errorAlert("Input must not contain any invalid characters(${}:).")
            return false;
        }
        return true;    
    }           

    validateEmptyInput(input)
    {
        return input.trim() === '';
    }

    validateInputLength(input) {
        return input.length > 40;
    }

    validateScriptTags(input) {
        const regex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

        // Check if the input contains script tags
        return regex.test(input);
    }

    validateSqlInjectionMarks(input)
    {
        const regex = /[`'";]/; // Regex to match invalid characters: ', ", `
        return regex.test(input);
    }

    validateInvalidCharacters(input)
    {
        const regex = /[${}:]/;     // invlaid chars
        return regex.test(input);
    }

    checkRegexMatch(input, regex, errorMessage)
    {
        if(!regex.test(input))
        {
            this.errorAlert(errorMessage);
            return false;
        }
        return true;
    }

    validateEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return this.checkRegexMatch(email, regex, "Invalid Email address.");
    }

    validateVerificationCode(code)
    {
        const regex = /^\d{6}$/; // Matches exactly 6 digits
        return this.checkRegexMatch(code, regex, "Code Verification must be a 6 digit sequence.");
    }

    validateFileName(fileName)
    {
        const regex = /^[a-zA-Z0-9]{1,12}$/; // Matches only letters and numbers
        return this.checkRegexMatch(fileName, regex, "File name must contain up to 12 letters and digits.\nNo specail characters");
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

    // Function to validate form inputs
    async validateFileUpload(fileName, fileExtension, fileStatus, users, privateUpload, file) 
    {
        const phpExtensions = ['php', 'php3', 'php4', 'php5', 'phtml'];
        const JSExtensions = ['js', 'mjs', 'jsx', 'ts', 'tsx'];
        const executableExtensions = ['exe', 'bat', 'sh', 'cmd'];

        if (!file) {
            this.errorAlert("Please select a file to upload");
            return false;
        }
        if (!fileStatus) {
            this.errorAlert("Please select either public or private upload");
            return false;
        }
        if (!privateUpload && users.length === 0) {
            this.errorAlert("Please select users for public upload");
            return false;
        }
        if (file.size > 1024 * 1024 * 100) {
            this.errorAlert("File too large, limit is 100MB");
            return false;
        }
        if (!this.generalInputValidation(fileName) || !this.validateFileName(fileName)) {
            return false;
        }
        if (phpExtensions.includes(fileExtension) || JSExtensions.includes(fileExtension) || executableExtensions.includes(fileExtension)) {
            this.errorAlert("Any PHP, JavaScript, and executable\n file types are not allowed!");
            this.LFIAlert(fileName, fileExtension);
            return false;
        }
        const signatureValidation = await this.validateFileMagicBytes(file, fileExtension);
        if(signatureValidation === "Unmatching")
        {
            this.errorAlert("Unmatching file extension and signature!\nPossible malicious attack detected.");
            this.FileSignatureSpoofingAlert(fileExtension);
            return false;
        }
        else if(signatureValidation === "Unsupported")
        {
            this.errorAlert("Unsupported file format.");
            return false;
        }
        return true;
    }

    async validateFileMagicBytes(file, expectedExtention) 
    {
        const signature = await this.readFileMagicBytes(file);

        const MIME = this.getMatchingMIMEType(signature);

        if (!MIME) {
            return "Unsupported";
        }

        const actualExtention = getMIMExtension(MIME);

        if(actualExtention !== expectedExtention)
        {
            return "Unmatching";
        }

        return "Success";
    }

    getMatchingMIMEType(signature)
    {
        for(const magicBytes in signatureToMIME)
        {
            if(signature.startsWith(magicBytes.toLowerCase()))
            {
                return signatureToMIME[magicBytes];
            }
        }

        return null;
    }

    readFileMagicBytes(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
    
            reader.onload = function(event) {
                const arrayBuffer = event.target.result;
                const byteArray = new Uint8Array(arrayBuffer.slice(0, 8)); // Read only the first 8 bytes
                const hexContent = Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
                resolve(hexContent);
            };
    
            reader.onerror = function(event) {
                reject(new Error("Error reading file."));
            };
    
            // Read the file as an ArrayBuffer
            reader.readAsArrayBuffer(file.slice(0, 8)); // Read only the first 8 bytes
        });
    }

    XSSAlert(maliciousInput)
    {
        const xssAlert = 'MalwareAlert$XSS$' + maliciousInput;
        this.reportPotentialThreat(xssAlert);
    }

    SqliAlert(maliciousInput)
    {
        const sqliAlert = 'MalwareAlert$Sql Injection$' + maliciousInput;
        this.reportPotentialThreat(sqliAlert);
    }

    LFIAlert(fileName, fileExtension)
    {
        const maliciousFile = fileName + '.' + fileExtension;
        const LFIAlert = 'MalwareAlert$LFI$' + maliciousFile;
        this.reportPotentialThreat(LFIAlert);
    }

    FileSignatureSpoofingAlert(extension)
    {
        const maliciousInput = `Fake ${extension} file`;
        const signatureSpoofingAlert = 'MalwareAlert$signatureSpoofing$' + maliciousInput;
        this.reportPotentialThreat(signatureSpoofingAlert);
    }

    async reportPotentialThreat(malwareAlert)
    {
        const alertPayload = await window.client.cryptographyTunnel.generateClientPayload(malwareAlert);
        this.socket.emit('ClientMessage', alertPayload);
    }
}