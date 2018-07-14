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
    res.redirect('/user');
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
var deletedNoteModel = mongoose.model('deletednote', noteSchema);

// Sign in
router.post('/signin', function (req, res) {
  // Get post informations
  var username = req.body.username;
  var password = req.body.password;

  if (!check_username_pass(username, password))
    return res.sendStatus(400);

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
    return res.sendStatus(400);

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

router.post('/refreshnotes', function (req, res) {
  if (!req.session.username)
    return res.sendStatus(403);
  req.session.knownTime = 0;
  return res.sendStatus(200);
})

// Notes live update to client
router.get('/updatenotes', function (req, res) {
  if (!req.session.username)
    return res.sendStatus(403);
  // Query every note with greather than update_time
  noteModel.find({ owner: req.session.username, last_update: { $gt: req.session.knownTime } }, function (err, result) {
    if (err)
      return res.sendStatus(500);
    var returnJson = {};
    if (result.length > 0) {
      returnJson.updates = [];
      result.forEach(function (element) {
        returnJson.updates.push({ title: element.title, text: element.text, id: element._id });
      });
    }

    deletedNoteModel.find({ owner: req.session.username, last_update: { $gt: req.session.knownTime } }, '_id', function (err, deletedResults) {
      if (err)
        return res.sendStatus(500);
      req.session.knownTime = Date.now();
      if (deletedResults.length > 0) {
        returnJson.deleted = [];
        deletedResults.forEach(deletedElement => {
          returnJson.deleted.push(deletedElement.id);
        });
      }
      if (returnJson.updates === undefined && returnJson.deleted === undefined)
        return res.sendStatus(204);
      return res.send(JSON.stringify(returnJson));
    });
  });
});

// Note updater from client
router.post('/sendupdatednote', function (req, res) {
  if (!req.session.username)
    return res.sendStatus(403);
  var noteID = req.body.id;
  noteModel.findOneAndUpdate({ _id: noteID, owner: req.session.username },
    { $set: { title: req.body.title, text: req.body.text, last_update: Date.now() } }, function (err, found) {
      if (err)
        return res.sendStatus(500);
      if (!found)
        return res.sendStatus(404);
      return res.sendStatus(200);
    });
});

// Note remover
router.post('/delnote', function (req, res) {
  if (!req.session.username)
    return res.sendStatus(403);
  var targetID = req.body.id;
  noteModel.findOneAndDelete({ _id: targetID, owner: req.session.username }, function (err, found) {
    if (err)
      return res.sendStatus(500);
    if (found) {
      // TODO: Better note move
      console.log('Note removed for ' + req.session.username);
      var backup = new deletedNoteModel({ _id: found._id, owner: found.owner, title: found.title, text: found.text, last_update: Date.now() });
      backup.save();
      return res.sendStatus(200);
    }
    return res.sendStatus(404);
  })
});

module.exports = router;
