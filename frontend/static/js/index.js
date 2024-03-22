import Client from "./client.js";

// Initialize client
window.client = new Client();
await window.client.init();

// Router for handling popstate events
window.addEventListener("popstate", window.client.router);

// Add click event listener to the button
const continueButton = document.getElementById('continueButton');
continueButton.addEventListener('click', function(event) {
  // Prevent default action (click) during the first 3 seconds
  if (this.hasAttribute('disabled')) {
    event.preventDefault();
  }
});

// Enable the button after 3 seconds
setTimeout(function() {
  continueButton.removeAttribute('disabled');
  document.getElementById('connectionStatus').textContent = 'Established';
  // Remove animation class
  document.getElementById('connectionStatus').classList.remove('animating');
}, 3000);

// Add animation class while establishing connection
setTimeout(function() {
  document.getElementById('connectionStatus').classList.add('animating');
}, 300);

// Add click event listener to the button for navigation
continueButton.addEventListener('click', async () => {
  window.client.navigateTo('/login');
});
