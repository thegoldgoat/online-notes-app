// Requires
const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const crypt_algorithm = 'aes-256-ctr';

// Router instance
var router = express.Router();

// Crypto functions
function encrypt(buffer, password, algorithm) {
  var cipher = crypto.createCipher(algorithm, password)
  var crypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return crypted;
}
function decrypt(buffer, password, algorithm) {
  var decipher = crypto.createDecipher(algorithm, password)
  var dec = Buffer.concat([decipher.update(buffer), decipher.final()]);
  return dec;
}

router.get('/sessiondemo', function (req, res) {
  if (req.session.views) {
    req.session.views++
    res.setHeader('Content-Type', 'text/html')
    res.write('<p>views: ' + req.session.views + '</p>')
    res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>')
    res.end()
  } else {
    req.session.views = 1
    res.end('welcome to the session demo. refresh!')
  }
});

// Main page
router.get('/', function (req, res, next) {
  var fileName = __dirname + '/doc/' + 'index.html';
  res.sendFile(fileName);
});

// Other doc elements
router.get('/:name', function (req, res) {
  var fileName = req.params.name;
  res.sendFile(__dirname + '/doc/' + fileName);
});

// upload post method
router.post('/upload', function (req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;

  // Process the file buffer
  var cryptFunction = req.body.isCrypt == 'True' ? encrypt : decrypt;
  var newBuffer = cryptFunction(sampleFile.data, req.body.password, crypt_algorithm);

  // Writes the buffer into file
  var wstream = fs.createWriteStream('/tmp/' + sampleFile.name);
  wstream.write(newBuffer);
  wstream.end();

  res.send("<a href='/crypt/file/" + sampleFile.name + "'>Download</a>");
});

// File download
router.get('/file/:name', function (req, res) {
  var fileName = req.params.name;
  res.download('/tmp/' + fileName);
});




module.exports = router;