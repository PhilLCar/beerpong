CREATE DATABASE IF NOT EXISTS boulette;

USE boulette;

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS names;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS pairs;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS lobbies;

CREATE TABLE lobbies (
    LobbyID         VARCHAR(4)          NOT NULL    PRIMARY KEY,
    GameState       INT                 NOT NULL    DEFAULT     0,
    Timer           TIMESTAMP           NOT NULL    DEFAULT     NOW()
);

CREATE TABLE users (
    LobbyID         VARCHAR(4)          NOT NULL,
    UserName        VARCHAR(128)        NOT NULL,
    Host            BOOLEAN             NOT NULL    DEFAULT     FALSE,
    UserOrder       INT                             DEFAULT     NULL,
    UserStatus      INT                 NOT NULL    DEFAULT     0,
    PRIMARY KEY     (LobbyID, UserName),
    FOREIGN KEY     (LobbyID)           REFERENCES  lobbies(LobbyID)
);

CREATE TABLE pairs (
    LobbyID         VARCHAR(4)          NOT NULL,
    PairName        VARCHAR(128)        NOT NULL,
    Score           INT                 NOT NULL    DEFAULT     0,
    UserA           VARCHAR(128)        NOT NULL,
    UserB           VARCHAR(128)        NOT NULL,
    UserC           VARCHAR(128),
    PRIMARY KEY     (LobbyID, PairName),
    FOREIGN KEY     (LobbyID)           REFERENCES  lobbies(LobbyID),
    FOREIGN KEY     (LobbyID, UserA)    REFERENCES  users(LobbyID, UserName),
    FOREIGN KEY     (LobbyID, UserB)    REFERENCES  users(LobbyID, UserName),
    FOREIGN KEY     (LobbyID, UserC)    REFERENCES  users(LobbyID, UserName)
);

CREATE TABLE categories (
    LobbyID         VARCHAR(4)          NOT NULL,
    CatName         VARCHAR(128)        NOT NULL,
    PRIMARY KEY     (LobbyID, CatName),
    FOREIGN KEY     (LobbyID)           REFERENCES  lobbies(LobbyID)
);

CREATE TABLE names (
    LobbyID         VARCHAR(4)          NOT NULL,
    UserName        VARCHAR(128)        NOT NULL,
    Item            VARCHAR(128)        NOT NULL,
    CatName         VARCHAR(128)        NOT NULL,
    PRIMARY KEY     (LobbyID, UserName, Item),
    FOREIGN KEY     (LobbyID)           REFERENCES  lobbies(LobbyID),
    FOREIGN KEY     (LobbyID, UserName) REFERENCES  users(LobbyID, UserName)
);

CREATE TABLE messages (
    MessageID       INT                 NOT NULL    PRIMARY KEY     AUTO_INCREMENT,
    LobbyID         VARCHAR(4)          NOT NULL,
    UserName        VARCHAR(128)        NOT NULL,
    Content         VARCHAR(1024)       NOT NULL,
    TimeSent        TIMESTAMP           NOT NULL    DEFAULT     NOW(),
    FOREIGN KEY     (LobbyID)           REFERENCES  lobbies(LobbyID),
    FOREIGN KEY     (LobbyID,UserName)  REFERENCES  users(LobbyID, UserName)
);