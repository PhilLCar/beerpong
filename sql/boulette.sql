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
    Played          BOOLEAN             NOT NULL    DEFAULT     FALSE,
    Score           INT                 NOT NULL    DEFAULT     0,
    PRIMARY KEY     (LobbyID, UserName),
    FOREIGN KEY     (LobbyID)           REFERENCES  lobbies(LobbyID)
);

CREATE TABLE pairs (
    LobbyID         VARCHAR(4)          NOT NULL,
    PairName        VARCHAR(128)        NOT NULL,
    UserA           VARCHAR(128)        NOT NULL,
    UserB           VARCHAR(128)        NOT NULL,
    UserC           VARCHAR(128)                    DEFAULT     NULL,
    PRIMARY KEY     (LobbyID, PairName),
    FOREIGN KEY     (LobbyID)           REFERENCES  lobbies(LobbyID),
    FOREIGN KEY     (LobbyID, UserA)    REFERENCES  users(LobbyID, UserName),
    FOREIGN KEY     (LobbyID, UserB)    REFERENCES  users(LobbyID, UserName),
    FOREIGN KEY     (LobbyID, UserC)    REFERENCES  users(LobbyID, UserName)
);

CREATE TABLE categories (
    LobbyID         VARCHAR(4)          NOT NULL,
    CatName         VARCHAR(128)        NOT NULL,
    UserName        VARCHAR(128)        NOT NULL,
    PRIMARY KEY     (LobbyID, CatName),
    FOREIGN KEY     (LobbyID)           REFERENCES  lobbies(LobbyID),
    FOREIGN KEY     (LobbyID, UserName) REFERENCES  users(LobbyID, UserName)
);

CREATE TABLE names (
    LobbyID         VARCHAR(4)          NOT NULL,
    UserName        VARCHAR(128)        NOT NULL,
    Item            VARCHAR(128)        NOT NULL,
    CatName         VARCHAR(128)        NOT NULL,
    Used            BOOLEAN             NOT NULL    DEFAULT     FALSE,
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

DROP FUNCTION IF EXISTS create_pair;
DROP FUNCTION IF EXISTS append_pair;
DROP FUNCTION IF EXISTS pair_status;

DELIMITER .
CREATE FUNCTION create_pair (
    PLobbyID        VARCHAR(4),
    PPairName       VARCHAR(128),
    PUserA          VARCHAR(128),
    PUserB          VARCHAR(128)
) RETURNS BOOLEAN
BEGIN
    DECLARE PUserAAvail BOOLEAN;
    DECLARE PUserBAvail BOOLEAN;
    SET PUserAAvail = EXISTS(SELECT * FROM users WHERE LobbyID=PLobbyID AND UserName=PUserA AND UserStatus&3=0);
    SET PUserBAvail = EXISTS(SELECT * FROM users WHERE LobbyID=PLobbyID AND UserName=PUserB AND UserStatus&3=0);
    IF PUserAAvail AND PUserBAvail THEN
        UPDATE users SET UserStatus=UserStatus|2 WHERE LobbyID=PLobbyID AND (UserName=PUserA OR UserName=PUserB);
        INSERT INTO pairs(LobbyID, PairName, UserA, UserB) VALUES (PLobbyID, PPairName, PUserA, PUserB);
    END IF;
    RETURN PUserAAvail AND PUserBAvail;
END.
DELIMITER ;

DELIMITER .
CREATE FUNCTION append_pair (
    PLobbyID        VARCHAR(4),
    PPairName       VARCHAR(128),
    PUserC          VARCHAR(128)
) RETURNS BOOLEAN
BEGIN
    DECLARE PUserCAvail BOOLEAN;
    SET PUserCAvail = EXISTS(SELECT * FROM users WHERE LobbyID=PLobbyID AND UserName=PUserA AND UserStatus&3=0);
    IF PUserCAvail THEN
        UPDATE users SET UserStatus=UserStatus|2 WHERE LobbyID=PLobbyID AND UserName=PUserC;
        UPDATE pairs SET UserC=PUserC WHERE LobbyID=PLobbyID AND PairName=PPairName;
    END IF;
    RETURN PUserCAvail;
END.
DELIMITER ;

DELIMITER .
CREATE FUNCTION pair_status (
    PLobbyID        VARCHAR(4),
    PPairName       VARCHAR(128)
) RETURNS INT
BEGIN
    DECLARE PStatus INT;
    SELECT UserA INTO @PUserA FROM pairs WHERE LobbyID=PLobbyID AND PairName=PPairName;
    SELECT UserB INTO @PUserB FROM pairs WHERE LobbyID=PLobbyID AND PairName=PPairName;
    SELECT UserC INTO @PUserC FROM pairs WHERE LobbyID=PLobbyID AND PairName=PPairName;
    SELECT UserStatus INTO @PUserAStatus FROM users WHERE LobbyID=PLobbyID AND UserName=@PUserA;
    SELECT UserStatus INTO @PUserBStatus FROM users WHERE LobbyID=PLobbyID AND UserName=@PUserB;
    IF @PUserC != NULL THEN
        SELECT UserStatus INTO @PUserCStatus FROM users WHERE LobbyID=PLobbyID AND UserName=@PUserC;
        SET PStatus=@PUserAStatus&@PUserBStatus&@PUserCStatus;
    ELSE
        SET PStatus=@PUserAStatus&@PUserBStatus;
    END IF;
    RETURN PStatus;
END.
DELIMITER ;

DROP PROCEDURE IF EXISTS set_pair;
DROP PROCEDURE IF EXISTS delete_pair;
DROP PROCEDURE IF EXISTS create_user_order;

DELIMITER .
CREATE PROCEDURE set_pair (
    PLobbyID        VARCHAR(4),
    PPairName       VARCHAR(128)
)
BEGIN
    SELECT UserA INTO @PUserA FROM pairs WHERE LobbyID=PLobbyID AND PairName=PPairName;
    SELECT UserB INTO @PUserB FROM pairs WHERE LobbyID=PLobbyID AND PairName=PPairName;
    SELECT UserC INTO @PUserC FROM pairs WHERE LobbyID=PLobbyID AND PairName=PPairName;
    UPDATE users SET UserStatus=UserStatus&125|1 WHERE LobbyID=PLobbyID AND UserName=@PUserA;
    UPDATE users SET UserStatus=UserStatus&125|1 WHERE LobbyID=PLobbyID AND UserName=@PUserB;
    UPDATE users SET UserStatus=UserStatus&125|1 WHERE LobbyID=PLobbyID AND UserName=@PUserC;
END.
DELIMITER ;

DELIMITER .
CREATE PROCEDURE delete_pair (
    PLobbyID        VARCHAR(4),
    PPairName       VARCHAR(128)
)
BEGIN
    SELECT UserA INTO @PUserA FROM pairs WHERE LobbyID=PLobbyID AND PairName=PPairName;
    SELECT UserB INTO @PUserB FROM pairs WHERE LobbyID=PLobbyID AND PairName=PPairName;
    SELECT UserC INTO @PUserC FROM pairs WHERE LobbyID=PLobbyID AND PairName=PPairName;
    UPDATE users SET UserStatus=UserStatus&125 WHERE LobbyID=PLobbyID AND UserName=@PUserA;
    UPDATE users SET UserStatus=UserStatus&125 WHERE LobbyID=PLobbyID AND UserName=@PUserB;
    UPDATE users SET UserStatus=UserStatus&125 WHERE LobbyID=PLobbyID AND UserName=@PUserC;
    DELETE FROM pairs WHERE LobbyID=PLobbyID AND PairName=PPairName;
END.
DELIMITER ;

DELIMITER .
CREATE PROCEDURE create_user_order (
)
BEGIN
END.
DELIMITER ;