document.addEventListener("DOMContentLoaded", () => {
  
  window.client = new Client();
  window.client.init();

  document.getElementById('loginButton').addEventListener('click', () => {
    window.client.loadNextPage('/login');
  });
    
});
