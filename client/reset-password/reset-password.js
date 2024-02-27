const socket = io({
    query: {
      newUser: false
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("verifyCodeForm").addEventListener('submit', async function (event) {
        event.preventDefault();
        
        const message = document.getElementById("message");
        const verificationCode = document.getElementsByName("code")[0].value;

        message.style.display = "none"; 
    
        const verifyCodeRequest = 'VerifyEmailCode$' + verificationCode;
        const verifyCodePayload = await sendToServerPayload(verifyCodeRequest);

        socket.emit('ClientMessage', verifyCodePayload);

        socket.on('codeVerificationResult', async (codeVerificationResult) => {
            if(codeVerificationResult === "Fail")
            {
                message.style.display = "block";
                message.innerText = "Wrong Verification Code!";
            }
            else
            {
                console.log("good");
                window.location.href = '/reset-password';
            }
        });
    });
});

