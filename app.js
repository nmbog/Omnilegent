/* SETUP */
require('dotenv').config();

var bcrypt = require('bcrypt');
var mysql = require('mysql');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
var secretKey = 'your_secret_key';
var express = require('express');
var app = express();

app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies
app.use(express.static('public'));
app.use(cookieParser());

PORT = 9124;

// DB
var db = require('./database/db-connector');

// Generate JWT
function generateToken(username) {
    return jwt.sign({ username }, secretKey, { expiresIn: '1h' });
}

// Verify JWT
function authenticateToken(req, res, next) {
     // Look for token in Authorization header (if using Authorization header)
     const authHeader = req.headers['authorization'];
     const token = authHeader && authHeader.split(' ')[1];
 
     // Alternatively, look for token in cookies
     const tokenFromCookies = req.cookies.jwt;
 
     if (tokenFromCookies) {
         jwt.verify(tokenFromCookies, secretKey, (err, user) => {
             if (err) {
                 return res.status(403).send('Invalid token');
             }
             req.user = user; // Attach user info to request
             next();
         });
     } else if (token) {
         jwt.verify(token, secretKey, (err, user) => {
             if (err) {
                 return res.status(403).send('Invalid token');
             }
             req.user = user; // Attach user info to request
             next();
         });
     } else {
         res.status(401).send('Access denied');
     }
 }

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

// Render Register Page
app.get('/register', (req, res) => {
    res.render('register');
});

// Render Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Register User
app.post('/register', async(req, res) => {
    try {
        const { username, userPassword } = req.body;
        const hashedPassword = await bcrypt.hash(userPassword, 10);
        const sql = "INSERT INTO Users (username, userPassword) VALUES (?, ?)";
        db.pool.query(sql, [username, hashedPassword], (err, result) => {
            if (err) throw err;
            res.status(201).send('User registration was successful');
        });
    } catch (error) {
        res.status(500).send('Error registering user');
    }
});

// User Login
app.post('/login', async(req, res) => {
    try {
        const { username, userPassword } = req.body;
        const sql = "SELECT * FROM Users WHERE username = ?";
        db.pool.query(sql, [username], async (err, results) => {
            if (err) throw err;
            if (results.length === 0) {
                return res.status(401).send('Invalid username or password');
            }
            const user = results[0];
            const passwordMatch = await bcrypt.compare(userPassword, user.userPassword);
            if (passwordMatch) {
                // Generate JWT token
                const token = jwt.sign({ username: user.username}, secretKey, { expiresIn: '1h' });
                res.cookie('jwt', token, { httpOnly: true, secure: false, maxAge: 3600000});
                return res.redirect('/protected');
            } else {
                return res.status(401).send('Invalid username or password');
            }
        });
    } catch (error) {
        res.status(500).send('Error loggin in');
    }
});

// User is logged in
app.get('/protected', authenticateToken, (req, res) => {
    const { username } = req.user;
    let query1 = "SELECT b.title, a.fullName, g.genre, ubs.readingStatus, DATE_FORMAT(ubs.startDate, '%m-%d-%y') AS startDate, DATE_FORMAT(ubs.finishDate, '%m-%d-%y') AS finishDate FROM UserBookStatus ubs JOIN Books b ON ubs.ISBN = b.ISBN JOIN Authors a ON b.authorID = a.authorID JOIN Genres g ON b.genreID = g.genreID JOIN Users u ON ubs.userID = u.userID WHERE u.userID = (SELECT userID FROM Users WHERE username = ?)";
    db.pool.query(query1, [username], function(error, rows, fields){
        if (error) {
            return res.status(500).send("Error retrieving user data")
        }
        res.render('protected', { username, data: rows });
    })
});

app.get('/logout', (req, res) => {
    res.clearCookie('jwt'); // Clear the JWT cookie
    res.redirect('/login'); // Redirect the user to the login page
});


/* LISTENER */
app.listen(PORT, function() {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});

