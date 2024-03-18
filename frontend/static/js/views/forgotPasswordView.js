import AbstractView from "./AbstractView.js";

export default class ForgotPasswordView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Forgot Password");
    }

    async getHtml() {
        try {
            const response = await fetch('/forgotPassword');
            const html = await response.text();
            return html;
        } catch (error) {
            console.error('Error fetching HTML:', error);
            return null; // or handle the error accordingly
        }
    }

    async executeViewScript()
    {
        document.getElementById("forgotPasswordForm").addEventListener('submit', async function (event) {
            event.preventDefault();
            
            const message = document.getElementById("message");
            const username = document.getElementsByName("username")[0].value;
        
            window.client.username = username;
        
            message.style.display = "none"; 
        
            const forgotPasswordRequest = 'ForgotPassword$' + username;
            const forgotPasswordResult = await window.client.transferToServer(forgotPasswordRequest, 'forgotPasswordResult');
        
            if(forgotPasswordResult === "Fail")
            {
                message.style.display = "block";
                message.innerText = "Username doesn't exist";
            }
            else
            {
                window.client.navigateTo('/codeVerification');
            }
        
        });
    }

}