// import AbstractView from "./views/AbstractView.js";
import Client from "./client.js"

// export default class extends AbstractView{
//   constructor() {
//     this.setTitle("Home");
//   }

//   async getHtml() {
//     try {
//         const response = await fetch('/');
//         const html = await response.text();
//         return html;
//     } catch (error) {
//         console.error('Error fetching HTML:', error);
//         return null; // or handle the error accordingly
//     }
//   }
// }

window.client = new Client();
await window.client.init();

// Add click event listener to the button
document.getElementById('loginButton').addEventListener('click', function(event) {
  if (this.hasAttribute('disabled')) {
    event.preventDefault(); // Prevent default action (click) during the first 3 seconds
  }
});

// Set timeout to enable the button after 3 seconds
setTimeout(function() {
  var loginButton = document.getElementById('loginButton');
  loginButton.removeAttribute('disabled');
  document.getElementById('connectionStatus').textContent = 'Established';
  document.getElementById('connectionStatus').classList.remove('animating'); // Remove animation class
}, 1500);

// Add animation class while establishing connection
setTimeout(function() {
  document.getElementById('connectionStatus').classList.add('animating');
}, 300);

document.getElementById('loginButton').addEventListener('click', () => {
  window.client.navigateTo('/login');
});
    

