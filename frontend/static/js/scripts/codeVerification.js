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


