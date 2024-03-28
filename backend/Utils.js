const { v4: uuidv4 } = require('uuid');
const fs = require('fs');


// Generates a unique user ID using UUIDv4.

function generateUniqueUserId() {
    return uuidv4();
}

// Initializes a map of users' emails.
async function initializeUsersEmailsMap(DBHandler, usersArray) {
    let map = new Map();
    for (const user of usersArray) {
        if (user !== '') {
            const userEmail = await DBHandler.getUserEmail(user);
            map.set(user, userEmail);
        }
    }
    return map;
}

// Generates a verification code of 6 digits.
function generateVerificationCode() {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += Math.floor(Math.random() * 10); // Generate a random digit (0-9)
    }
    return code;
}

// Writes a message to a log file.
function writeToLogFile(logFilePath, message) {
    // Get current date and time
    const currentDateTime = new Date().toISOString();

    // Log message to be written
    const logMessage = `${currentDateTime}: ${message}\n`;

    // Append log message to log.txt file
    fs.appendFileSync(logFilePath, logMessage);
}

module.exports = {
    generateUniqueUserId,
    initializeUsersEmailsMap,
    generateVerificationCode,
    writeToLogFile
};
