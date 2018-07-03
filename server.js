const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');


var app = express();
// default options
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));

const mainroute = require('./mainroute/main');
app.use('/', mainroute);

app.listen(8000);
console.log('Server working');