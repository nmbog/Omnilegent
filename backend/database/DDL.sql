SET FOREIGN_KEY_CHECKS=0;
SET AUTOCOMMIT=0;

DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Books;
DROP TABLE IF EXISTS Authors;
DROP TABLE IF EXISTS Genres;
DROP TABLE IF EXISTS UserBookStatus;

/* Create Users table */
CREATE OR REPLACE TABLE Users (
    userID int NOT NULL AUTO_INCREMENT, 
    username varchar(45) NOT NULL UNIQUE,
    email varchar(255) NOT NULL,
    userPassword varchar(45) NOT NULL,
    PRIMARY KEY (userID),
    UNIQUE (userID, username)
);

/* Create Authors table */
CREATE OR REPLACE TABLE Authors (
    authorID int NOT NULL AUTO_INCREMENT,
    fullName varchar(255) NOT NULL,
    authorBio TEXT,
    PRIMARY KEY (authorID),
    UNIQUE (authorID, fullName),
);

/* Create Genres table */
CREATE OR REPLACE TABLE Genres (
    genreID int NOT NULL AUTO_INCREMENT,
    genre varchar(255) NOT NULL,
    PRIMARY KEY (genreID),
    UNIQUE (genreID)
);

/* Create Books table */
CREATE OR REPLACE TABLE Books (
    ISBN int NOT NULL,
    title varchar(45) NOT NULL,
    authorID int NOT NULL,
    genreID int NOT NULL,
    bookDescription TEXT,
    PRIMARY KEY (ISBN),
    FOREIGN KEY (authorID) REFERENCES Authors (authorID),
    FOREIGN KEY (genreID) REFERENCES Genres (genreID),
    UNIQUE (ISBN)
);

/* Create UserBookStatus table */
CREATE OR REPLACE TABLE UserBookStatus (
    statusID int NOT NULL AUTO_INCREMENT,
    userID int NOT NULL,
    ISBN int NOT NULL,
    readingStatus ENUM('Completed', 'In Progress', 'Not Started', 'Did Not Finish'),
    startDate DATE,
    finishDate DATE,
    PRIMARY KEY (statusID),
    FOREIGN KEY (userID) REFERENCES Users (userID),
    FOREIGN KEY (ISBN) REFERENCES Books (ISBN),
    UNIQUE (statusID)
);


SET FOREIGN_KEY_CHECKS=1;
SET AUTOCOMMIT=1;