const nodemailer = require('nodemailer');
const config = require('./Config');
const { file } = require('googleapis/build/src/apis/file');

class EmailSender
{
    constructor()
    {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
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
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }

    sendEmailVerificationCode(userEmail)
    {        
        const verificationCode = this.generateVerificationCode();
        const mailDetails = {
            from: config.EMAIL,
            to: userEmail, // recipient email address
            subject: 'Verification Code',
            text: 'Your verification code is: ' + verificationCode
        };
        this.sendEmail(mailDetails);

        return verificationCode;
    }

    generateVerificationCode()
    {
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += Math.floor(Math.random() * 10); // Generate a random digit (0-9)
        }
        return code;
    }

    sendUsersNotifications(fileOwner, fileName, usersEmailsMap) 
    {
        for (const [user, email] of usersEmailsMap) 
        {
            this.sendNotification(fileOwner, fileName, email);
        }
    }

    sendNotification(fileOwner, fileName, sendToEmail)
    {
        const mailDetails = {
            from: config.EMAIL,
            to: sendToEmail, 
            subject: 'Access Notification',
            text: fileOwner + ' shared the file: ' + fileName + ' with you'
        };
        this.sendEmail(mailDetails);
    }
}

module.exports = {EmailSender};