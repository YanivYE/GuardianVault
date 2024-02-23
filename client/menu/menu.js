const socket = io({
    query: {
      newUser: false
    }
  });

document.addEventListener('DOMContentLoaded', async function () 
{
    const username = window.sessionStorage.getItem("Username");
    document.getElementById("title").textContent=`Welcome ${username}!`;

    const logoutButton = document.getElementById('logoutButton');

    logoutButton.addEventListener('click', function() {
        userLogout();
    });

    async function userLogout()
    {
        const logoutRequest = 'Logout$';
        const logoutPayload = await sendToServerPayload(logoutRequest);

        socket.emit('ClientMessage', logoutPayload);

        socket.on('logoutResult', async (logoutResult) => {
            if(logoutResult === 'Success')
            {
                window.location.href = '/login';
            }
        });
    }
});