const path = require('path');

module.exports = {
  entry: './frontend/static/js/inputValidation.js', // Correct path to inputValidation.js
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'frontend', 'dist') // Output directory within the frontend directory
  }
};
