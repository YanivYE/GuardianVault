const nodemailer = require('nodemailer');
const Utils = require('./Utils');
const config = require('./config');

class EmailSender
{
    constructor()
    {
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

    sendEmail(mailDetails)
    {
        this.transporter.sendMail(mailDetails, function(error, info){
            if (error) {
                console.log(error);
            } 
        });
    }

    sendEmailVerificationCode(userEmail)
    {        
        const verificationCode = Utils.generateVerificationCode();
        console.log(verificationCode);
        const mailDetails = {
            from: config.EMAIL,
            to: userEmail, // recipient email address
            subject: 'Verification Code',
            text: `Your verification code is: ${verificationCode}`
        };
        this.sendEmail(mailDetails);

        return verificationCode;
    }
 
    sendUsersNotifications(fileOwner, fileName, usersEmailsMap) 
    {
        for (const [user, email] of usersEmailsMap) 
        {
            if(user !== '')
            {
                this.sendNotification(fileOwner, fileName, email);
            }
        }
    }

    sendNotification(fileOwner, fileName, sendToEmail) {
        const mailDetails = {
            from: config.EMAIL,
            to: sendToEmail,
            subject: 'Access Notification',
            text: `${fileOwner} shared the file: ${fileName} with you`
        };
        this.sendEmail(mailDetails);
    }

    sendAdminThreatAlert(threat, attacker)
    {
        const mailDetails = {
            from: config.EMAIL,
            to: config.ADMIN_EMAIL,
            subject: 'EMERGENCY: SYSTEM UNDER ATTACK',
            text: `Hello ADMIN,\nUser ${attacker} has recently initiated a malicious ${threat} attack!\nPlease address this urgently.`
        };
        this.sendEmail(mailDetails);
    }
}

module.exports = {EmailSender};