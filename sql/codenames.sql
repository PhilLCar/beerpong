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
    Teams3      BOOLEAN         NOT NULL            DEFAULT FALSE,
    GameState   INT             NOT NULL            DEFAULT 0,
    Turn        INT             NOT NULL            DEFAULT 0,
    Timer       TIMESTAMP       NOT NULL            DEFAULT NOW(),
    LastPause   TIMESTAMP       NOT NULL            DEFAULT NOW()
);

CREATE TABLE colors (
    ID          INT             NOT NULL            PRIMARY KEY         AUTO_INCREMENT,
    Color       VARCHAR(64)     NOT NULL
);

CREATE TABLE cells (
    ID          VARCHAR(4)      NOT NULL,
    Discovered  BOOLEAN         NOT NULL            DEFAULT FALSE,
    Tentative   BOOLEAN         NOT NULL            DEFAULT FALSE,
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
    Pass        BOOLEAN         NOT NULL            DEFAULT FALSE,
    UserStatus  INT             NOT NULL            DEFAULT 0,
    SX          INT                                 DEFAULT NULL,
    SY          INT                                 DEFAULT NULL,
    ColorID     INT                                 DEFAULT NULL,
    LastUpdate  TIMESTAMP       NOT NULL            DEFAULT NOW(),
    PRIMARY KEY (ID, UserName),
    FOREIGN KEY (ID, SX, SY)    REFERENCES          cells(ID, X, Y),
    FOREIGN KEY (ColorID)       REFERENCES          colors(ID)
);

CREATE TABLE teams (
    ID          VARCHAR(4)      NOT NULL,
    Captain     VARCHAR(128)                        DEFAULT NULL,
    Playing     INT             NOT NULL            DEFAULT 0,
    Turn        INT             NOT NULL            DEFAULT 0,
    ColorID     INT             NOT NULL,
    TeamOrder   INT             NOT NULL            DEFAULT 0,
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
DROP FUNCTION IF EXISTS colorID;

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

DELIMITER .
CREATE FUNCTION colorID (
    PColor  VARCHAR(64)
) RETURNS INT 
BEGIN
    SELECT ID INTO @ID FROM colors WHERE Color=PColor;
    RETURN ID;
END.
DELIMITER ;

DROP PROCEDURE IF EXISTS game_init;
DROP PROCEDURE IF EXISTS clear_color;

DELIMITER .
CREATE PROCEDURE game_init (
    PID     VARCHAR(4)
)
BEGIN
    SELECT ID INTO @RID FROM colors WHERE Color='red';
    SELECT ID INTO @BID FROM colors WHERE Color='blue';
    SELECT ID INTO @YID FROM colors WHERE Color='yellow';
    INSERT INTO teams(ID, ColorID) VALUES (PID, @RID);
    INSERT INTO teams(ID, ColorID) VALUES (PID, @BID);
    INSERT INTO teams(ID, ColorID) VALUES (PID, @YID);
END.
DELIMITER ;

DELIMITER .
CREATE PROCEDURE clear_color (
    PID     VARCHAR(4),
    PColor  VARCHAR(64)
)
BEGIN
    SELECT ID INTO @CID FROM colors WHERE Color=PColor;
    UPDATE teams SET Captain=NULL, Playing=FALSE, Turn=0 WHERE ID=PID AND ColorID=@CID;
    UPDATE users SET ColorID=NULL WHERE ID=PID AND ColorID=@CID;
END.
DELIMITER ;