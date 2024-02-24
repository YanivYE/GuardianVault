document.addEventListener("DOMContentLoaded", () => {
        handleNewClientConnection();

        document.getElementById('loginButton').addEventListener('click', () => {
          window.location.href = '/login';
        });
});
