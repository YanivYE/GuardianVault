document.addEventListener("DOMContentLoaded", async () => {
  if (!window.client) {
    // Create the client object only if it doesn't exist
    window.client = new Client();
    await window.client.init();
  }
  
  const clientData = {
    sharedKey: window.client.getSharedKey(),
    // Store the socket ID instead of the socket object
    socketId: window.client.getSocket().id
    // Add more properties if needed
  };

  // Store in sessionStorage
  sessionStorage.setItem('clientData', JSON.stringify(clientData));

  // Redirect to the login page with serialized client data in URL
  document.getElementById('loginButton').addEventListener('click', async () => {
    window.location.href = '/login';
  });
});
