/* SETUP */
require('dotenv').config();

var bcrypt = require('bcrypt');
var mysql = require('mysql');
var jwt = require('jsonwebtoken');
var secretKey = 'your_secret_key';
var express = require('express');
var app = express();

app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies
app.use(express.static('public'));

PORT = 9124;

// DB
var db = require('./database/db-connector');

// Generate JWT
function generateToken(username) {
    return jwt.sign({ username }, secretKey, { expiresIn: '1h' });
}

// Verify JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send('Access denied');
    }
    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).send('Invalid token');
        }
        req.user = user;
        next();
    });
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
            if (!passwordMatch) {
                return res.status(401).send('Invalid username or password');
            }
            // Generate JWT token
            const token = jwt.sign({ username: user.username}, secretKey, {expiresIn: '1h' });
            res.json({ token });
        });
    } catch (error) {
        res.status(500).send('Error loggin in');
    }
})

// User is logged in
app.post('/protected', authenticateToken, (req, res) => {
    const {username } = req.user;
    res.send(`Welcome ${username}!`);
});

/* LISTENER */
app.listen(PORT, function() {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});

