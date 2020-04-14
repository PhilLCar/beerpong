CREATE DATABASE IF NOT EXISTS whoami;

USE whoami;

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS games;

CREATE TABLE games (
    GameID              VARCHAR(4)      NOT NULL        PRIMARY KEY,
    GameState           INT             NOT NULL        DEFAULT 0,
    Turn                INT             NOT NULL        DEFAULT 0,
    LastPause           TIMESTAMP       NOT NULL        DEFAULT NOW(),
    Timer               TIMESTAMP       NOT NULL        DEFAULT NOW()
);

CREATE TABLE users (
    GameID              VARCHAR(4)      NOT NULL,
    UserName            VARCHAR(128)    NOT NULL,
    UserGiven           VARCHAR(128)                    DEFAULT NULL,
    UserChoosing        VARCHAR(128)                    DEFAULT NULL,
    UserOrder           INT             NOT NULL        DEFAULT 0,
    UserStatus          INT             NOT NULL        DEFAULT 0,
    Turn                INT             NOT NULL        DEFAULT 0,
    Score               INT             NOT NULL        DEFAULT 0,
    Host                BOOLEAN         NOT NULL        DEFAULT FALSE,
    LastUpdate          TIMESTAMP       NOT NULL        DEFAULT NOW(),
    PRIMARY KEY         (GameID, UserName),
    FOREIGN KEY         (GameID)        REFERENCES      games(GameID)
);

ALTER TABLE users ADD FOREIGN KEY (GameID, UserChoosing) REFERENCES users(GameID, UserName);

CREATE TABLE messages (
    MessageID       INT                 NOT NULL        PRIMARY KEY     AUTO_INCREMENT,
    GameID          VARCHAR(4)          NOT NULL,
    UserName        VARCHAR(128)        NOT NULL,
    Content         VARCHAR(1024)       NOT NULL,
    TimeSent        TIMESTAMP           NOT NULL        DEFAULT NOW(),
    FOREIGN KEY     (GameID)            REFERENCES      games(GameID),
    FOREIGN KEY     (GameID, UserName)  REFERENCES      users(GameID, UserName)
);

DROP FUNCTION IF EXISTS user_active;
DROP FUNCTION IF EXISTS game_active;

CREATE FUNCTION user_active (
    PGameID     VARCHAR(4),
    PUserName   VARCHAR(128)
) RETURNS BOOLEAN 
RETURN EXISTS (
    SELECT * FROM users 
        WHERE GameID=PGameID AND UserName=PUserName
        AND   TIMESTAMPDIFF(SECOND, LastUpdate, NOW())<=30
);

CREATE FUNCTION game_active (
    PGameID     VARCHAR(4)
) RETURNS BOOLEAN 
RETURN EXISTS (
    SELECT * FROM users 
        WHERE GameID=PGameID AND Host=TRUE
        AND   TIMESTAMPDIFF(SECOND, LastUpdate, NOW())<=30
);

DROP PROCEDURE IF EXISTS order_users;

DELIMITER .
CREATE PROCEDURE order_users (
    PGameID             VARCHAR(4)
)
BEGIN
    SET @POrder=-1;
    UPDATE users SET UserOrder=(@POrder:=@POrder+1) WHERE GameID=PGameID ORDER BY RAND();
END.
DELIMITER ;