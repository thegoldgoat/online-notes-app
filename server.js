console.clear();

const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const session = require('express-session')
const mongoose = require('mongoose');


mongoose.connect('mongodb://localhost:27017/test');
var db = mongoose.connection;
db.on('error', function () {
  console.error("Can't connect to database.");
  process.exit(1);
});
db.once('open', function () {
  console.log('Connected to mongo database.');
});

var app = express();
// default options
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'canexcaney', resave: false, saveUninitialized: false }));

// Template engine
app.set('view engine', 'ejs');

const cryptroute = require('./crypt/route');
app.use('/crypt', cryptroute);
const userroute = require('./userdb/route');
app.use('/user', userroute);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
})


app.listen(8000);
console.log('Server working');