document.addEventListener("DOMContentLoaded", () => {
  const client = new Client();
  client.init();

  document.getElementById('loginButton').addEventListener('click', () => {
    loadLoginPage();
  });

  function loadLoginPage() {
    // Fetch the content of the login page asynchronously
    fetch('/login.html')
      .then(response => response.text())
      .then(html => {
          // Replace the entire document's content with the content fetched from login.html
          document.open();
          document.write(html);
          document.close();
      })
      .catch(error => {
          console.error('Error loading login page:', error);
      });
  }
    
});
