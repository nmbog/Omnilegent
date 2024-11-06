/* SETUP */
require('dotenv').config();

var bcrypt = require('bcrypt');
var express = require('express');
var app = express();
PORT = 9124;

// DB
var db = require('./database/db-connector');

// Handlebars
const { engine } = require('express-handlebars');
var exphbs = require('express-handlebars');
app.engine('.hbs', engine({extname: ".hbs"}));
app.set('view engine', '.hbs');

/* ROUTES */
app.get('/', function(req, res)
    {
        res.render('index');
    });

/* LISTENER */
app.listen(PORT, function() {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});

