import AbstractView from "./AbstractView.js";

export default class MenuView extends AbstractView {
  constructor() {
    super();
    this.setTitle("Menu");
  }

  // Generate HTML for the menu view
  async getHtml() {
    return `
      <div class="container-menu100" style="background-image: url('static/css/images/bg-01.jpg');">
        <h1 id="title">Welcome!</h1>
        <div class="button-container">
          <button id="download" class="button">
            <img src="static/css/images/download.png" alt="Download Icon">
            Download
          </button>
          <button id="upload" class="button">
            <img src="static/css/images/upload.png" alt="Upload Icon">
            Upload
          </button>
        </div>
        <div class="form-group-menu" id="logoutLoader" style="display: none;">
          <div class="loader"></div>
        </div>
        <h2>‎ </h2>
        <button class="logout-button-menu" id="logoutButton"></button>
      </div>
    `;
  }

  // Execute scripts related to the menu view
  async executeViewScript() {
    // Redirect to login page if not logged in
    if (!window.client.loggedIn) {
      window.client.navigateTo('/login');
      return;
    }
    
    const username = window.client.username;
    document.getElementById("title").textContent = `Welcome ${username}!`;

    // Logout functionality
    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', async function() {
      await userLogout();
      logoutButton.disabled = true;
    });

    // Navigation to download page
    document.getElementById('download').addEventListener('click', function() {
      window.client.navigateTo('/download');
    });

    // Navigation to upload page
    document.getElementById('upload').addEventListener('click', function() {
      window.client.navigateTo('/upload');
    });

    // Function for user logout
    async function userLogout() {
      // Display loader
      document.getElementById('logoutLoader').style.display = 'block';

      // Perform logout request to the server
      const logoutRequest = 'Logout$';
      const logoutResult = await window.client.transferToServer(logoutRequest, 'logoutResult');

      // Handle logout response
      if (logoutResult === 'Success') {
        // Update client status
        window.client.loggedIn = false;
        // Clear CSRF token
        window.client.csrfToken = "";
        // Hide loader
        document.getElementById('logoutLoader').style.display = 'none';
        // Redirect to home page
        window.client.navigateTo('/');
        // Cleanup client data
        window.client = null; // or window.client = undefined;
      }
    }
  }
}
