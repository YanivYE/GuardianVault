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


