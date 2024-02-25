const socket = io({
    query: {
      newUser: false
    }
  });

document.addEventListener('DOMContentLoaded', async function () 
{
    if (window.sessionStorage.getItem('Username') == null) {
      window.location.href = '/login'; // Redirect to login page if not logged in
    }
    const username = window.sessionStorage.getItem("Username");
    document.getElementById("title").textContent=`Welcome ${username}!`;

    const logoutButton = document.getElementById('logoutButton');

    logoutButton.addEventListener('click', function() {
        userLogout();
    });

    async function userLogout()
    {
        document.getElementById('logoutLoader').style.display = 'block';
        const logoutRequest = 'Logout$';
        const logoutPayload = await sendToServerPayload(logoutRequest);

        socket.emit('ClientMessage', logoutPayload);

        socket.on('logoutResult', async (logoutResult) => {
            if(logoutResult === 'Success')
            {
              document.getElementById('logoutLoader').style.display = 'none';
              window.location.href = '/login';
            }
        });
    }
});