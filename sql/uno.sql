CREATE DATABASE IF NOT EXISTS uno;

USE uno;

DROP TABLE IF EXISTS deck;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS games;

CREATE TABLE games (
  GameID                VARCHAR(4)                   NOT NULL                    PRIMARY KEY,
  GameState             INTEGER                      NOT NULL                    DEFAULT 0,
  Turn                  INTEGER                      NOT NULL                    DEFAULT 0,
  Clockwise             BOOLEAN                      NOT NULL                    DEFAULT TRUE,
  DeckColor             INTEGER                                                  DEFAULT NULL,
  PickStack             INTEGER                      NOT NULL                    DEFAULT 0,
  RequestUpdate         INTEGER                      NOT NULL                    DEFAULT 0
);

CREATE TABLE users (
  UserID                INTEGER                      NOT NULL   AUTO_INCREMENT   PRIMARY KEY,
  GameID                VARCHAR(4)                   NOT NULL,
  UserName              VARCHAR(512)                 NOT NULL,
  HideCards             BOOLEAN                      NOT NULL                    DEFAULT FALSE,
  Uno                   BOOLEAN                      NOT NULL                    DEFAULT FALSE,
  Signal                BOOLEAN                      NOT NULL                    DEFAULT FALSE,
  FOREIGN KEY           (GameID)                     REFERENCES                  games(GameID)
);

CREATE TABLE deck (
  GameID                VARCHAR(4)                   NOT NULL,
  CardID                INTEGER                      NOT NULL,
  OwnerID               INTEGER                                                  DEFAULT NULL,
  DeckPosition          INTEGER                                                  DEFAULT NULL,
  PRIMARY KEY           (GameID, CardID),
  FOREIGN KEY           (GameID)                     REFERENCES                  games(GameID),
  FOREIGN KEY           (OwnerID)                    REFERENCES                  users(UserID)
);