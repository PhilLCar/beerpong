CREATE DATABASE IF NOT EXISTS uno;

USE uno;

DROP TABLE IF EXISTS deck;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS games;

CREATE TABLE games (
  GameID                VARCHAR(4)                   NOT NULL                    PRIMARY KEY,
  GameState             INTEGER                      NOT NULL                    DEFAULT 0,
  Turn                  INTEGER                      NOT NULL                    DEFAULT 0
);

CREATE TABLE users (
  UserID                INTEGER                      NOT NULL   AUTO_INCREMENT   PRIMARY KEY,
  GameID                VARCHAR(4)                   NOT NULL                    FOREIGN KEY REFERENCES   games(GameID),
  UserName              VARCHAR(128)                 NOT NULL,
  HideCards             BOOLEAN                      NOT NULL                    DEFAULT FALSE
);

CREATE TABLE deck (
  GameID                VARCHAR(4)                   NOT NULL                    FOREIGN KEY REFERENCES   games(GameID),
  CardID                INTEGER                      NOT NULL   AUTO_INCREMENT,
  OwnerID               INTEGER                                                  FOREIGN KEY REFERENCES   users(UserID),
  DeckPosition          INTEGER,
  PRIMARY KEY           (GameID, CardID)
);