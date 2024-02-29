// const socket = window.client.socket;

document.addEventListener('DOMContentLoaded', async function () 
{
    if (!window.client.logedIn) {
      window.client.loadNextPage('/login'); // Redirect to login page if not logged in
    }

    const username = window.client.username;
    document.getElementById("title").textContent=`Welcome ${username}!`;

    document.getElementById('logoutButton').addEventListener('click', function() {
        userLogout();
    });

    document.getElementById('download').addEventListener('click', function() {
      window.client.loadNextPage('/download');
    });

    document.getElementById('upload').addEventListener('click', function() {
      window.client.loadNextPage('/upload');
    });

    async function userLogout()
    {
        document.getElementById('logoutLoader').style.display = 'block';
        const logoutRequest = 'Logout$';
        const logoutPayload = await window.client.sendToServerPayload(logoutRequest);

        socket.emit('ClientMessage', logoutPayload);

        socket.on('logoutResult', async (logoutResult) => {
            if(logoutResult === 'Success')
            {
              document.getElementById('logoutLoader').style.display = 'none';
              window.client.loadNextPage('/login');
            }
        });
    }
});