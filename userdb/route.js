const express = require('express');

// Router instance
var router = express.Router();

// Sign up sign in page
router.get('/', function(req, res) {
  // Check if session is already active
  if (req.session.username) {
    res.redirect('/myfiles')
  }
  // If it is not logged, then display the login page
  var fileName = __dirname + '/doc/' + 'index.html';
  res.sendFile(fileName);
});

// Files page
router.get('/myfiles', function(req, res) {
  // Check if session is already active
  res.send('files page!');
});

module.exports = router;