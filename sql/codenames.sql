CREATE DATABASE IF NOT EXISTS codenames;

USE codenames;

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS cells;
DROP TABLE IF EXISTS colors;
DROP TABLE IF EXISTS games;

CREATE TABLE games (
    ID          VARCHAR(4)      NOT NULL            PRIMARY KEY,
    GameState   INT             NOT NULL            DEFAULT 0,
    Turn        INT             NOT NULL            DEFAULT 0,
    Timer       TIMESTAMP       NOT NULL            DEFAULT NOW()
);

CREATE TABLE colors (
    ID          INT             NOT NULL            PRIMARY KEY         AUTO_INCREMENT,
    Color       VARCHAR(64)     NOT NULL
);

CREATE TABLE cells (
    ID          VARCHAR(4)      NOT NULL,
    X           INT             NOT NULL,
    Y           INT             NOT NULL,
    Content     VARCHAR(128)    NOT NULL,
    ColorID     INT             NOT NULL,
    PRIMARY KEY (ID, X, Y),
    FOREIGN KEY (ID)            REFERENCES          games(ID),
    FOREIGN KEY (ColorID)       REFERENCES          colors(ID)
);

CREATE TABLE users (
    ID          VARCHAR(4)      NOT NULL,
    UserName    VARCHAR(128)    NOT NULL,
    Host        BOOLEAN         NOT NULL            DEFAULT FALSE,
    UserStatus  INT             NOT NULL            DEFAULT 0,
    SX          INT,
    SY          INT,
    ColorID     INT,
    LastUpdate  TIMESTAMP       NOT NULL            DEFAULT NOW(),
    PRIMARY KEY (ID, UserName),
    FOREIGN KEY (ID, SX, SY)    REFERENCES          cells(ID, X, Y),
    FOREIGN KEY (ColorID)       REFERENCES          colors(ID)
);

CREATE TABLE teams (
    ID          VARCHAR(4)      NOT NULL,
    Captain     VARCHAR(128),
    Playing     BOOLEAN         NOT NULL            DEFAULT FALSE,
    Turn        INT             NOT NULL            DEFAULT 0,
    ColorID     INT             NOT NULL,
    PRIMARY KEY (ID, ColorID),
    FOREIGN KEY (ID)            REFERENCES          games(ID),
    FOREIGN KEY (ColorID)       REFERENCES          colors(ID),
    FOREIGN KEY (ID, Captain)   REFERENCES          users(ID, UserName)
);

CREATE TABLE messages (
    MessageID   INT             NOT NULL            PRIMARY KEY         AUTO_INCREMENT,
    ID          VARCHAR(4)      NOT NULL,
    UserName    VARCHAR(128)    NOT NULL,
    Content     VARCHAR(1024)   NOT NULL,
    TimeSent    TIMESTAMP       NOT NULL            DEFAULT NOW(),
    FOREIGN KEY (ID)            REFERENCES          games(ID),
    FOREIGN KEY (ID,UserName)   REFERENCES          users(ID, UserName)
);

INSERT INTO colors(Color) VALUES ('black');
INSERT INTO colors(Color) VALUES ('yellow');
INSERT INTO colors(Color) VALUES ('red');
INSERT INTO colors(Color) VALUES ('blue');


DROP FUNCTION IF EXISTS user_active;
DROP FUNCTION IF EXISTS game_active;

CREATE FUNCTION user_active (
    PID         VARCHAR(4),
    PUserName   VARCHAR(128)
) RETURNS BOOLEAN 
RETURN EXISTS (
    SELECT * FROM users 
        WHERE ID=PID AND UserName=PUserName
        AND   TIMESTAMPDIFF(SECOND, LastUpdate, NOW())<=30
);

CREATE FUNCTION game_active (
    PID    VARCHAR(4)
) RETURNS BOOLEAN 
RETURN EXISTS (
    SELECT * FROM users 
        WHERE ID=PID AND Host=TRUE
        AND   TIMESTAMPDIFF(SECOND, LastUpdate, NOW())<=30
);
