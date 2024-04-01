import Client from "./client.js";

// Initialize client
const initializeClient = async () => {
  window.client = new Client();
  await window.client.init();
};

// Handle popstate events with router
const handlePopState = () => {
  window.client.router();
};

// Enable the button after 3 seconds
const enableButton = () => {
  const continueButton = document.getElementById('continueButton');
  setTimeout(() => {
    continueButton.removeAttribute('disabled');
    document.getElementById('connectionStatus').textContent = 'Established';
    // Remove animation class
    document.getElementById('connectionStatus').classList.remove('animating');
  }, 3000);
};

// Add animation class while establishing connection
const addConnectionAnimation = () => {
  setTimeout(() => {
    document.getElementById('connectionStatus').classList.add('animating');
  }, 500);
};

// Handle click event on continue button
const handleContinueButtonClick = () => {
  const continueButton = document.getElementById('continueButton');
  continueButton.addEventListener('click', (event) => {
    // Prevent default action (click) during the first 3 seconds
    if (continueButton.hasAttribute('disabled')) {
      event.preventDefault();
    } else {
      window.client.navigateTo('/login');
    }
  });
};

// Main function to run the initialization and event listeners
const main = async () => {
  await initializeClient();
  window.addEventListener("popstate", handlePopState);
  enableButton();
  addConnectionAnimation();
  handleContinueButtonClick();
};

// Run the main function
main();
