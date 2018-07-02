const express = require('express');
const fileUpload = require('express-fileupload');

var app = express();
// default options
app.use(fileUpload());

// Main page
app.get('/', function (req, res, next) {
  var options = {
    root: __dirname + '/doc/',
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };
  var fileName = 'index.html';
  res.sendFile(fileName, options, function (err) {
    if (!err)
      console.log('Sent:', fileName);
  });
});

// upload post method
app.post('/upload', function (req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;

  sampleFile.mv('/tmp/' + sampleFile.name, function (err) {
    if (err)
      return res.status(500).send(err);
    console.log('File received!');
  });

  // Process the file


  res.send("<a href='/file/" + sampleFile.name + "'>Download</a>");
});

// File download
app.get('/file/:name', function (req, res) {
  var fileName = req.params.name;
  res.download('/tmp/' + fileName);
});

app.listen(8000);
console.log('Server va');