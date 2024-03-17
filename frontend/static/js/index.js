import Client from "./client.js"

window.client = new Client();
await window.client.init();
window.addEventListener("popstate", async () => {
  await window.client.router();
});

// Add click event listener to the button
document.getElementById('continueButton').addEventListener('click', function(event) {
  if (this.hasAttribute('disabled')) {
    event.preventDefault(); // Prevent default action (click) during the first 3 seconds
  }
});

// Set timeout to enable the button after 3 seconds
setTimeout(function() {
  var loginButton = document.getElementById('continueButton');
  loginButton.removeAttribute('disabled');
  document.getElementById('connectionStatus').textContent = 'Established';
  document.getElementById('connectionStatus').classList.remove('animating'); // Remove animation class
}, 1500);

// Add animation class while establishing connection
setTimeout(function() {
  document.getElementById('connectionStatus').classList.add('animating');
}, 300);

document.getElementById('continueButton').addEventListener('click', async () => {
  window.client.navigateTo('/login');
});
    

