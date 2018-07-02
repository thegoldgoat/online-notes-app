const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');
const crypt_algorithm = 'aes-256-ctr';

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

var app = express();
// default options
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));

// Main page
app.get('/', function (req, res, next) {
  var fileName = __dirname + '/doc/' + 'index.html';
  res.sendFile(fileName);
});

// upload post method
app.post('/upload', function (req, res) {
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

  res.send("<a href='/file/" + sampleFile.name + "'>Download</a>");
});

// File download
app.get('/file/:name', function (req, res) {
  var fileName = req.params.name;
  res.download('/tmp/' + fileName);
});

app.listen(8000);
console.log('Server va');