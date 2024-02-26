const nodemailer = require('nodemailer');
const config = require('./Config');

class EmailSender
{
    constructor()
    {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.EMAIL, // Your email address
                pass: config.PASSWORD // Your password
            }
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
        // const verificationCode = getVerificationCode();
        const mailDetails = {
            from: config.EMAIL,
            to: userEmail, // recipient email address
            subject: 'Verification Code',
            text: 'Your verification code is: ' + 3123214
        };
        this.sendEmail(mailDetails);
    }
}

module.exports = {EmailSender};