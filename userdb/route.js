const express = require('express');

// Router instance
var router = express.Router();

// Sign up sign in page
router.get('/', function (req, res) {
  // Check if session is already active
  if (req.session.username) {
    res.redirect('/user/myfiles');
  }
  // If it is not logged, then display the login page
  var fileName = __dirname + '/doc/' + 'index.html';
  res.sendFile(fileName);
});

// Files page
router.get('/myfiles', function (req, res) {
  // Check if session is already active
  res.send('files page!');
});


function check_username_pass(username, password) {
  if (!username || !password ||
    username.length == 0 || password.length == 0)
    return false;
  return true;
}

// Sign in
router.post('/signin', function (req, res) {
  // Get post informations
  var username = req.body.username;
  var password = req.body.password;

  if (!check_username_pass(username, password))
    res.sendStatus(400);

  // Check if it is correct
  if (true) {
    req.session.username = username;
    res.redirect('/user/myfiles');
  }
  req.session.username = undefined;
  res.redirect('/user/');
});

// Log in
router.post('/login', function (req, res) {
  // Get post informations
  var username = req.body.username;
  var password = req.body.password;

  if (!check_username_pass(username, password))
    res.sendStatus(400);

  // Check if it is correct
  if (true) {
    req.session.username = username;
    res.redirect('/user/myfiles');
  }
  req.session.username = undefined;
  res.redirect('/user/');
});

module.exports = router;