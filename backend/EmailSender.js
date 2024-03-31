// Import necessary modules
const nodemailer = require('nodemailer');
const Utils = require('./Utils');
const config = require('./config');

// Class for sending emails
class EmailSender {
    constructor() {
        // Initialize nodemailer transporter
        this.transporter = nodemailer.createTransport({
            service: config.EMAIL_SERVICE,
            host: config.HOST,
            port: config.SMTP_PORT,
            secure: true,
            auth: {
                user: config.EMAIL,
                pass: config.PASSWORD,
            },
        });
    }

    // Function to send email
    sendEmail(mailDetails) {
        this.transporter.sendMail(mailDetails, function(error, info) {
            if (error) {
                console.error("Error occurred while sending email:", error);
            }
        });
    }

    // Function to send verification code email
    sendEmailVerificationCode(userEmail) {
        // Generate verification code
        const verificationCode = Utils.generateVerificationCode();

        // Prepare email details
        const mailDetails = {
            from: config.EMAIL,
            to: userEmail,
            subject: 'Verification Code',
            text: `Your verification code is: ${verificationCode}`
        };

        // Send email
        this.sendEmail(mailDetails);

        return verificationCode;
    }

    // Function to send notifications to users
    sendUsersNotifications(fileOwner, fileName, usersEmailsMap) {
        for (const [user, email] of usersEmailsMap) {
            if (user !== '') {
                // Send notification to each user
                this.sendNotification(fileOwner, fileName, email);
            }
        }
    }

    // Function to send notification email
    sendNotification(fileOwner, fileName, sendToEmail) {
        // Prepare email details
        const mailDetails = {
            from: config.EMAIL,
            to: sendToEmail,
            subject: 'Access Notification',
            text: `${fileOwner} shared the file: ${fileName} with you`
        };

        // Send email
        this.sendEmail(mailDetails);
    }

    // Function to send admin threat alert
    sendAdminThreatAlert(threat, attacker) {
        // Prepare email details
        const mailDetails = {
            from: config.EMAIL,
            to: config.ADMIN_EMAIL,
            subject: 'EMERGENCY CALL: SYSTEM UNDER ATTACK',
            text: `Hello ADMIN,\nUser ${attacker} has recently initiated a malicious ${threat} attack!\nPlease address this urgently.`
        };

        // Send email
        this.sendEmail(mailDetails);
    }
}

// Export EmailSender class
module.exports = { EmailSender };
