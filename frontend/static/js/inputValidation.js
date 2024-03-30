import { supportedFileSignatures } from "./utils.js";

export default class InputValidation {
    constructor(socket) {
        this.alertMessageBox;
        this.socket = socket;
    }

    // Set alert message box
    setMessageBox(message) {
        this.alertMessageBox = message;
    }

    // Display error message
    errorAlert(errorMessage) {
        this.showMessage(errorMessage, "red");
    }

    // Display success message
    successAlert(successMessage) {
        this.showMessage(successMessage, "green");
    }

    // Show message in alert message box
    showMessage(messageText, color) {
        this.alertMessageBox.style.display = "block";
        this.alertMessageBox.style.color = color;
        this.alertMessageBox.innerText = messageText;
    }

    // Perform general input validation
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

    // Validate if input is empty
    validateEmptyInput(input) {
        return input.trim() === '';
    }

    // Validate input length
    validateInputLength(input) {
        return input.length > 40;
    }

    // Validate if input contains script tags
    validateScriptTags(input) {
        const regex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
        return regex.test(input);
    }

    // Validate SQL injection marks
    validateSqlInjectionMarks(input) {
        const regex = /[`'";]/; // Regex to match invalid characters: ', ", `
        return regex.test(input);
    }

    // Validate invalid characters
    validateInvalidCharacters(input) {
        const regex = /[${}:]/; // Invalid characters
        return regex.test(input);
    }

    // Check if input matches regex pattern
    checkRegexMatch(input, regex, errorMessage) {
        if (!regex.test(input)) {
            this.errorAlert(errorMessage);
            return false;
        }
        return true;
    }

    // Validate email format
    validateEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return this.checkRegexMatch(email, regex, "Invalid Email address.");
    }

    // Validate verification code format
    validateVerificationCode(code) {
        const regex = /^\d{6}$/; // Matches exactly 6 digits
        return this.checkRegexMatch(code, regex, "Code Verification must be a 6 digit sequence.");
    }

    // Validate file name format
    validateFileName(fileName) {
        const regex = /^[a-zA-Z0-9\s]{1,12}$/; // Matches only letters and numbers
        return this.checkRegexMatch(fileName, regex, "File name must contain up to 12 letters and digits.\nNo special characters");
    }

    // Validate password strength
    validatePasswordStrength(strengthText) {
        if (strengthText !== 'Strong' && strengthText !== 'Excellent!') {
            this.errorAlert("Password strength must be at least Strong.");
            return false;
        }
        return true;
    }

    // Validate file upload
    async validateFileUpload(fileName, fileExtension, fileStatus, users, privateUpload, file) {
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
        if (fileExtension !== 'txt') // txt file has no signature
        {
            const signatureValidation = await this.validateFileSignature(file, fileExtension);
            if (signatureValidation === "Unmatching") {
                this.errorAlert("Unmatching file extension and signature!\nPossible malicious attack detected.");
                this.FileSignatureSpoofingAlert(fileExtension);
                return false;
            } else if (signatureValidation === "Unsupported") {
                this.errorAlert("Unsupported file format.");
                return false;
            }
        }

        return true;
    }

    // Validate file signature
    async validateFileSignature(file, extension) {
        const signature = await this.readFileMagicBytes(file);
        const expectedMagicBytes = supportedFileSignatures[extension];

        if (!expectedMagicBytes) {
            return "Unsupported";
        }

        if (!signature.startsWith(expectedMagicBytes.toLowerCase())) {
            return "Unmatching";
        }

        return "Success";
    }

    // Read file magic bytes
    readFileMagicBytes(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function (event) {
                const arrayBuffer = event.target.result;
                const byteArray = new Uint8Array(arrayBuffer.slice(0, 8)); // Read only the first 8 bytes
                const hexContent = Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
                resolve(hexContent);
            };

            reader.onerror = function (event) {
                reject(new Error("Error reading file."));
            };

            // Read the file as an ArrayBuffer
            reader.readAsArrayBuffer(file.slice(0, 8)); // Read only the first 8 bytes
        });
    }

    // Alert for Cross-Site Scripting (XSS) attack
    XSSAlert(maliciousInput) {
        const xssAlert = 'MalwareAlert$XSS$' + maliciousInput;
        this.reportPotentialThreat(xssAlert);
    }

    // Alert for SQL Injection attack
    SqliAlert(maliciousInput) {
        const sqliAlert = 'MalwareAlert$Sql Injection$' + maliciousInput;
        this.reportPotentialThreat(sqliAlert);
    }

    // Alert for Local File Inclusion (LFI) attack
    LFIAlert(fileName, fileExtension) {
        const maliciousFile = fileName + '.' + fileExtension;
        const LFIAlert = 'MalwareAlert$LFI$' + maliciousFile;
        this.reportPotentialThreat(LFIAlert);
    }

    // Alert for File Signature Spoofing attack
    FileSignatureSpoofingAlert(extension) {
        const maliciousInput = `Fake ${extension} file`;
        const signatureSpoofingAlert = 'MalwareAlert$signatureSpoofing$' + maliciousInput;
        this.reportPotentialThreat(signatureSpoofingAlert);
    }

    // Report potential threat to the server
    async reportPotentialThreat(malwareAlert) {
        const token = window.client.csrfToken;
        if(token !== '')
        {
            malwareAlert = token + '$' + malwareAlert;
        }
        const alertPayload = await window.client.cryptographyTunnel.generateClientPayload(malwareAlert);
        this.socket.emit('ClientMessage', alertPayload);
    }
}
