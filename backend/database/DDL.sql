SET FOREIGN_KEY_CHECKS=0;
SET AUTOCOMMIT=0;

DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Books;
DROP TABLE IF EXISTS Authors;
DROP TABLE IF EXISTS Genres;
DROP TABLE IF EXISTS UserBookStatus;

/* Create Users table */
CREATE OR REPLACE TABLE Users (
    userID int NOT NULL AUTO_INCREMENT UNIQUE, 
    username varchar(45) NOT NULL UNIQUE,
    email varchar(255) NOT NULL,
    userPassword varchar(45) NOT NULL,
    PRIMARY KEY (userID)
);

/* Create Authors table */
CREATE OR REPLACE TABLE Authors (
    authorID int NOT NULL AUTO_INCREMENT UNIQUE,
    fullName varchar(255) NOT NULL UNIQUE,
    authorBio TEXT,
    PRIMARY KEY (authorID)
);

/* Create Genres table */
CREATE OR REPLACE TABLE Genres (
    genreID int NOT NULL AUTO_INCREMENT UNIQUE,
    genre varchar(255) NOT NULL,
    PRIMARY KEY (genreID)
);

/* Create Books table */
CREATE OR REPLACE TABLE Books (
    ISBN int NOT NULL UNIQUE,
    title varchar(45) NOT NULL,
    authorID int NOT NULL,
    genreID int NOT NULL,
    bookDescription TEXT,
    PRIMARY KEY (ISBN),
    FOREIGN KEY (authorID) REFERENCES Authors (authorID),
    FOREIGN KEY (genreID) REFERENCES Genres (genreID)
);



