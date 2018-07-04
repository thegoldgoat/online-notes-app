const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Router instance
var router = express.Router();

// Sign up sign in page
router.get('/', function (req, res) {
  // Check if session is already active
  if (req.session.username) {
    res.redirect('/user/myfiles');
  }
  // If it is not logged, then display the login page
  var fileName = __dirname + '/views/' + 'index.html';
  res.sendFile(fileName);
});

// Files page
router.get('/myfiles', function (req, res) {
  // Check if session is already active
  if (!req.session.username)
    res.sendStatus(403);
  // render
  res.render('myfiles', { username: req.session.username })
});


function check_username_pass(username, password) {
  if (!username || !password ||
    username.length == 0 || password.length == 0)
    return false;
  return true;
}

function hash_of_string(input_string, hash_algorithm = 'sha256') {
  var hash = crypto.createHash('sha256');
  hash.update(input_string);
  return hash.digest('hex');
}

// Database schemas
var userAuthSchema = mongoose.Schema({
  username: String,
  password: String
});
// Database model
var userAuthModel = mongoose.model('userAuth', userAuthSchema);

// Sign in
router.post('/signin', function (req, res) {
  // Get post informations
  var username = req.body.username;
  var password = req.body.password;

  if (!check_username_pass(username, password))
    res.sendStatus(400);

  password = hash_of_string(password);

  // Check if it does not exists
  var SignUserModel = new userAuthModel({ username: username, password: password });
  // Search for it
  userAuthModel.findOne({ username: SignUserModel.username }, function (err, found) {
    if (err) {
      console.error(err);
      return res.sendStatus(500);
    }
    if (found) {
      // If you found one, send forbidden status code
      console.log('Found existing username! -> ' + found);
      return res.sendStatus(403);
    } else {
      // Create database user
      SignUserModel.save(function (err, _) {
        if (err) {
          console.error(err);
          return res.sendStatus(500);
        }
        req.session.username = username;
        return res.redirect('/user/myfiles');
      });
    }
  });
});

// Log in
router.post('/login', function (req, res) {
  // Get post informations
  var username = req.body.username;
  var password = req.body.password;

  if (!check_username_pass(username, password))
    res.sendStatus(400);

  password = hash_of_string(password);

  var SignUserModel = new userAuthModel({ username: username, password: password });
  userAuthModel.findOne({ username: SignUserModel.username, password: SignUserModel.password }, function (err, found) {
    if (err) {
      console.error(err);
      return res.sendStatus(500);
    }
    if (!found)
      return res.send('Wrong username or password.');

    // If it is found,
    req.session.username = found.username;
    return res.redirect('/user/myfiles');
  })
});

// Log out
router.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/user');
});

module.exports = router;