const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const session = require('express-session')


var app = express();
// default options
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({secret: 'canexcaney'}));

const cryptroute = require('./crypt/route');
app.use('/crypt', cryptroute);
const userroute = require('./userdb/route');
app.use('/user', userroute);


app.listen(8000);
console.log('Server working');