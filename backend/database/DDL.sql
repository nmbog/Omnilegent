SET FOREIGN_KEY_CHECKS=0;
SET AUTOCOMMIT=0;

DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Books;
DROP TABLE IF EXISTS Authors;
DROP TABLE IF EXISTS Genres;
DROP TABLE IF EXISTS UserBookStatus;

/* Create Users table */
CREATE TABLE Users (
    userID int NOT NULL AUTO_INCREMENT, 
    username varchar(45) NOT NULL,
    email varchar(255) NOT NULL,
    userPassword varchar(255) NOT NULL,
    PRIMARY KEY (userID),
    UNIQUE (username)
);

/* Create Authors table */
CREATE TABLE Authors (
    authorID int NOT NULL AUTO_INCREMENT,
    fullName varchar(255) NOT NULL,
    authorBio TEXT,
    PRIMARY KEY (authorID)
);

/* Create Genres table */
CREATE TABLE Genres (
    genreID int NOT NULL AUTO_INCREMENT,
    genre varchar(255) NOT NULL,
    PRIMARY KEY (genreID)
);

/* Create Books table */
CREATE TABLE Books (
    ISBN bigint NOT NULL,
    title varchar(255) NOT NULL,
    authorID int NOT NULL,
    genreID int NOT NULL,
    bookDescription TEXT,
    PRIMARY KEY (ISBN),
    FOREIGN KEY (authorID) REFERENCES Authors (authorID),
    FOREIGN KEY (genreID) REFERENCES Genres (genreID)
);

/* Create UserBookStatus table */
CREATE TABLE UserBookStatus (
    statusID int NOT NULL AUTO_INCREMENT,
    userID int NOT NULL,
    ISBN bigint NOT NULL,
    readingStatus ENUM('Completed', 'In Progress', 'Not Started', 'Did Not Finish'),
    startDate DATE,
    finishDate DATE,
    PRIMARY KEY (statusID),
    FOREIGN KEY (userID) REFERENCES Users (userID),
    FOREIGN KEY (ISBN) REFERENCES Books (ISBN)
);

/* Insert into Authors */
INSERT INTO Authors (fullName)
VALUES ("Stephen King");

/* Insert into Genres */
INSERT INTO Genres (genre)
VALUES ("Horror");

/* Insert into Books */
INSERT INTO Books (ISBN, title, authorID, genreID, bookDescription)
VALUES (9780450040184, "The Shining", 1, 1, "Jack Torrance, his wife Wendy, and their young son Danny move into the Overlook Hotel, where Jack has been hired as the winter caretaker. Cut off from civilization for months, Jack hopes to battle alcoholism and uncontrolled rage while writing a play. Evil forces residing in the Overlook – which has a long and violent history – covet young Danny for his precognitive powers and exploit Jack’s weaknesses to try to claim the boy.");


SET FOREIGN_KEY_CHECKS=1;
SET AUTOCOMMIT=1;