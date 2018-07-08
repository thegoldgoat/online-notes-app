const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Router instance
var router = express.Router();

// Sign up sign in page
router.get('/', function (req, res) {
  // Check if session is already active
  if (req.session.username) {
    res.redirect('/user/mynotes');
  }
  // If it is not logged, then display the login page
  var fileName = __dirname + '/views/' + 'index.html';
  res.sendFile(fileName);
});

// Notes page
router.get('/mynotes', function (req, res) {
  // Check if session is already active
  if (!req.session.username)
    res.sendStatus(403);
  // Set client known to 0
  req.session.knownTime = 0;
  // render
  res.render('mynotes', { username: req.session.username })
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
// * User
var userAuthSchema = mongoose.Schema({
  username: String,
  password: String
});
var userAuthModel = mongoose.model('userAuth', userAuthSchema);
// * Note
var noteSchema = mongoose.Schema({
  owner: String,
  title: String,
  text: String,
  last_update: Date
});
var noteModel = mongoose.model('note', noteSchema);

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
        return res.redirect('/user/mynotes');
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
    return res.redirect('/user/mynotes');
  })
});

// Log out
router.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/user');
});

// New note receiver
router.post('/newnote', function (req, res) {
  // Quit if not authenticated or are missing some Things<
  if (!req.session.username || !req.body.title || !req.body.text)
    return res.sendStatus(403);
  // Send the note to the database
  newNote = new noteModel({ owner: req.session.username, title: req.body.title, text: req.body.text, last_update: Date.now() });
  newNote.save();
  console.log('Added note to the database for user ' + req.session.username);
  res.sendStatus(200);
});

// Notes updater
router.get('/updatenotes', function (req, res) {
  // Query every note with greather than update_time
  var results = noteModel.find({ owner: req.session.username, last_update: { $gt: req.session.knownTime } }, function (err, result) {
    if (err)
      return res.sendStatus(500);
    req.session.knownTime = Date.now();
    var returnJson = { updates: [] };
    result.forEach(element => {
      returnJson.updates.push({ title: element.title, text: element.text, id: element._id });
    });
    return res.send(JSON.stringify(returnJson));
  });
});

module.exports = router;