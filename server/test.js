const http = require('http');

// Define IP address and port
const IP_ADDRESS = '172.31.47.29'; // Change this to your desired IP address
const PORT = 3000; // Change this to your desired port number

// Create HTTP server
const server = http.createServer((req, res) => {
  // Set response header
  res.writeHead(200, {'Content-Type': 'text/html'});

  // Write response content
  res.write('<h1>Hello, World!</h1>');

  // End the response
  res.end();
});

// Start the server
server.listen(PORT, IP_ADDRESS, () => {
  console.log(`Server running at http://${IP_ADDRESS}:${PORT}/`);
});
