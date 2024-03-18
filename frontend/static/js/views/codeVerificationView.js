import AbstractView from "./AbstractView.js";

export default class CodeVerificationView extends AbstractView{
    constructor() {
        super();
        this.setTitle("Code Verification");
    }

    async getHtml() {
        try {
            const response = await fetch('/codeVerification');
            const html = await response.text();
            return html;
        } catch (error) {
            console.error('Error fetching HTML:', error);
            return null; // or handle the error accordingly
        }
    }

    async executeViewScript()
    {
        document.getElementById("verifyCodeForm").addEventListener('submit', async function (event) {
            event.preventDefault();
            
            const message = document.getElementById("message");
            const verificationCode = document.getElementsByName("code")[0].value;
        
            message.style.display = "none"; 
        
            const verifyCodeRequest = 'VerifyEmailCode$' + verificationCode;
            const codeVerificationResult = await window.client.transferToServer(verifyCodeRequest, 'codeVerificationResult');
        
            if(codeVerificationResult === "Fail")
            {
                message.style.display = "block";
                message.innerText = "Wrong Verification Code!";
            }
            else if(codeVerificationResult === "passwordReset")
            {
                window.client.navigateTo('/resetPassword');
            }
            else
            {
                window.client.logedIn = true;
                window.client.navigateTo('/menu');
            }
        });
    }
}