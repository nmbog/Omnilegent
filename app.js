/* SETUP */
require('dotenv').config();

var bcrypt = require('bcrypt');
var mysql = require('mysql');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
var secretKey = process.env.SECRET_KEY;
var path = require('path');
var express = require('express');
var app = express();


app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies
app.use(express.static('public'));
app.use(cookieParser());
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/images', express.static(path.join(__dirname, 'images')));

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
const hbs = exphbs.create({
    extname: '.hbs',
    helpers: {
        ifEquals: function(arg1, arg2, options) {
            return arg1 === arg2 ? options.fn(this) : options.inverse(this);
        }
    }
});
app.engine('.hbs', hbs.engine);
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
            res.redirect('/login');
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

// Search Books
app.post('/search-add-book', authenticateToken, (req, res) => {
    const { username } = req.user;
    const { searchQuery, action } = req.body;

    if (action === "search") {
        // Search for books matching the query
        const searchSql = `
            SELECT b.ISBN, b.title AS BookTitle, a.fullName AS AuthorFullName, g.genre AS Genre
            FROM Books b
            JOIN Authors a ON b.authorID = a.authorID
            JOIN Genres g ON b.genreID = g.genreID
            WHERE b.title LIKE ? OR a.fullName LIKE ? OR g.genre LIKE ?
        `;

        db.pool.query(
            searchSql,
            [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`],
            (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error searching for books.");
                }

                // Render results on the page
                res.render('search-add-book', {
                    username,
                    searchQuery,
                    searchResults: results,
                });
            }
        );
    } else if (action === "add") {
        // Add the selected book to the user's tracked list
        const { ISBN, readingStatus, startDate, finishDate } = req.body;

        const addSql = `
            INSERT INTO UserBookStatus (userID, ISBN, readingStatus, startDate, finishDate)
            VALUES (
                (SELECT userID FROM Users WHERE username = ?),
                ?, ?, ?, ?
            )
        `;

        // accounts for fields that user leaves blank -- these fields are not required
        const status = readingStatus || null;
        const start = startDate || null;
        const finish = finishDate || null;

        db.pool.query(
            addSql,
            [username, ISBN, status, start, finish],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error adding book to tracked list.");
                }
                res.redirect('/protected'); // Redirect back to the user's tracked books
            }
        );
    }
});

// Add a book if not in DB
app.post('/add-new-book', authenticateToken, (req, res) => {
    const { ISBN, title, author, genre, readingStatus, startDate, finishDate } = req.body;
    const { username } = req.user;

    // Get the userID for the logged-in user
    const findUserIdQuery = "SELECT userID FROM Users WHERE username = ?";
    db.pool.query(findUserIdQuery, [username], (err, results) => {
        if (err) {
            return res.status(500).send('Error finding user ID');
        }

        const userID = results[0].userID;

        // Check if the author already exists
        const checkAuthorQuery = `
            SELECT authorID FROM Authors WHERE fullName = ?
        `;
        db.pool.query(checkAuthorQuery, [author], (err, authorResult) => {
            if (err) {
                return res.status(500).send('Error checking if author exists');
            }

            let authorID;

            if (authorResult.length > 0) {
                // Author already exists, use the existing authorID
                authorID = authorResult[0].authorID;
            } else {
                // Author does not exist, insert the new author
                const authorQuery = `
                    INSERT INTO Authors (fullName)
                    VALUES (?)
                `;
                db.pool.query(authorQuery, [author], (err, authorInsertResult) => {
                    if (err) {
                        return res.status(500).send('Error adding author');
                    }

                    // Get the authorID from the newly inserted author
                    authorID = authorInsertResult.insertId;
                });
            }

            // Ensure the genre exists (using INSERT IGNORE to avoid duplicates)
            const genreQuery = `
                INSERT IGNORE INTO Genres (genre)
                VALUES (?)
            `;
            db.pool.query(genreQuery, [genre], (err, genreResult) => {
                if (err) {
                    return res.status(500).send('Error adding genre');
                }

                // Get the genreID (in case it was already inserted)
                const getGenreIdQuery = `
                    SELECT genreID FROM Genres WHERE genre = ?
                `;
                db.pool.query(getGenreIdQuery, [genre], (err, genreResult) => {
                    if (err) {
                        return res.status(500).send('Error retrieving genre ID');
                    }

                    const genreID = genreResult[0].genreID;

                    // Add the book
                    const bookQuery = `
                        INSERT INTO Books (ISBN, title, authorID, genreID)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE title = VALUES(title)
                    `;
                    db.pool.query(bookQuery, [ISBN, title, authorID, genreID], (err) => {
                        if (err) {
                            return res.status(500).send('Error adding book');
                        }

                        // Add the book to the user's tracked books
                        const userBookQuery = `
                            INSERT INTO UserBookStatus (userID, ISBN, readingStatus, startDate, finishDate)
                            VALUES (?, ?, ?, ?, ?)
                        `;
                        const status = readingStatus || null;
                        const start = startDate || null;
                        const finish = finishDate || null;

                        db.pool.query(userBookQuery, [userID, ISBN, status, start, finish], (err) => {
                            if (err) {
                                return res.status(500).send('Error tracking book');
                            }
                            res.redirect('/protected');
                        });
                    });
                });
            });
        });
    });
});


// Delete tracked book
app.post('/delete-tracked-book', authenticateToken, (req, res) => {
    const { title } = req.body; // Getting the title of the book to delete
    const { username } = req.user;

    // Step 1: Get the userID for the logged-in user
    const findUserIdQuery = "SELECT userID FROM Users WHERE username = ?";
    db.pool.query(findUserIdQuery, [username], (err, results) => {
        if (err) {
            return res.status(500).send('Error finding user ID');
        }

        const userID = results[0].userID;

        // Step 2: Find the statusID for the book by title and userID
        const findStatusIDQuery = `
            SELECT statusID 
            FROM UserBookStatus
            JOIN Books ON UserBookStatus.ISBN = Books.ISBN
            WHERE Books.title = ? AND UserBookStatus.userID = ?
        `;
        db.pool.query(findStatusIDQuery, [title, userID], (err, result) => {
            if (err) {
                return res.status(500).send('Error finding statusID');
            }
            if (result.length === 0) {
                return res.status(404).send('Book not found in your tracked list');
            }

            const statusID = result[0].statusID;

            // Step 3: Delete the book from the UserBookStatus table based on the statusID
            const deleteBookQuery = "DELETE FROM UserBookStatus WHERE statusID = ?";
            db.pool.query(deleteBookQuery, [statusID], (err) => {
                if (err) {
                    return res.status(500).send('Error deleting tracked book');
                }

                // Redirect back to the protected page after successful deletion
                res.redirect('/protected');
            });
        });
    });
});

// User is logged in
app.get('/protected', authenticateToken, (req, res) => {
    const { username } = req.user;
    const { readingStatus } = req.query;
    let query1 = "SELECT b.title, a.fullName, g.genre, ubs.readingStatus, DATE_FORMAT(ubs.startDate, '%m-%d-%y') AS startDate, DATE_FORMAT(ubs.finishDate, '%m-%d-%y') AS finishDate FROM UserBookStatus ubs JOIN Books b ON ubs.ISBN = b.ISBN JOIN Authors a ON b.authorID = a.authorID JOIN Genres g ON b.genreID = g.genreID JOIN Users u ON ubs.userID = u.userID WHERE u.userID = (SELECT userID FROM Users WHERE username = ?)";
    if (readingStatus && readingStatus != 'All') {
        query1 += " AND ubs.readingStatus = ?";
    }
    const params = readingStatus && readingStatus !== 'All' ? [username, readingStatus] : [username];
    db.pool.query(query1, params, function(error, rows, fields){
        if (error) {
            return res.status(500).send("Error retrieving user data")
        }
        res.render('protected', { username, data: rows, readingStatus: readingStatus || 'All' });
    })
});

// logout of account
app.get('/logout', (req, res) => {
    res.clearCookie('jwt'); // Clear the JWT cookie
    res.redirect('/'); // Redirect the user to the login page
});

// Go to add book page
app.get('/add-book', (req, res) => {
    res.render('add-book');
});



/* LISTENER */
app.listen(PORT, function() {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});

