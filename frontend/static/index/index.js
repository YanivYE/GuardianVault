
  window.client = new Client();
  await window.client.init();

  document.getElementById('loginButton').addEventListener('click', () => {
    window.client.loadNextPage('/login');
  });
    

