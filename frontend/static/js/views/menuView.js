import AbstractView from "./AbstractView.js";

export default class MenuView extends AbstractView{
  constructor() {
    super();
    this.setTitle("Menu");
  }

  async getHtml() {
    return `<div class="container-menu100" style="background-image: url('static/css/images/bg-01.jpg');">
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
        <button class="logout-button-menu" id="logoutButton">Logout</button>
    </div>
    `;
  }

  async executeViewScript()
  {
    if (!window.client.logedIn) {
      window.client.navigateTo('/login'); // Redirect to login page if not logged in
    }
      
    const username = window.client.username;
    document.getElementById("title").textContent=`Welcome ${username}!`;
    
    const logoutButton = document.getElementById('logoutButton');
    
    logoutButton.addEventListener('click', function() {
        userLogout();
        logoutButton.disabled = true;
    });
    
    document.getElementById('download').addEventListener('click', function() {
      window.client.navigateTo('/download');
    });
    
    document.getElementById('upload').addEventListener('click', function() {
      window.client.navigateTo('/upload');
    });
    
    async function userLogout()
    {
        document.getElementById('logoutLoader').style.display = 'block';
    
        const logoutRequest = 'Logout$';
        const logoutResult = await window.client.transferToServer(logoutRequest, 'logoutResult');
    
        if(logoutResult === 'Success')
        {
          window.client.logedIn = false;
          localStorage.setItem('csrfToken', "");
          document.getElementById('logoutLoader').style.display = 'none';
          window.client.navigateTo('/');
    
          window.client = null; // or window.client = undefined;
        }
    }
  }
}