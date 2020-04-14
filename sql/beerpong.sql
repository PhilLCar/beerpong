CREATE DATABASE IF NOT EXISTS beerpong;

USE beerpong;

DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    UserName    VARCHAR(127)    NOT NULL    PRIMARY KEY,
    LastUpdate  TIMESTAMP       NOT NULL    DEFAULT      NOW(),
    Wins        INT             NOT NULL,
    Loses       INT             NOT NULL
);

CREATE TABLE teams (
    TeamName    VARCHAR(127)    NOT NULL    PRIMARY KEY,
    Color       VARCHAR(127),
    MemberA     VARCHAR(127)    NOT NULL,
    MemberB     VARCHAR(127),
    Wins        INT             NOT NULL,
    Loses       INT             NOT NULL,
    FOREIGN KEY (MemberA)       REFERENCES users(UserName),
    FOREIGN KEY (MemberB)       REFERENCES users(UserName)
);

CREATE TABLE games (
    GameID      INT             NOT NULL    PRIMARY KEY     AUTO_INCREMENT,
    Active      BOOLEAN         NOT NULL,
    TeamA       VARCHAR(127)    NOT NULL,
    TeamB       VARCHAR(127),
    GlassesA    INT             NOT NULL,
    GlassesB    INT             NOT NULL,
    RackA       INT             NOT NULL    DEFAULT     0,
    RackB       INT             NOT NULL    DEFAULT     0,
    Redemption  BOOLEAN         NOT NULL    DEFAULT     FALSE,
    Turn        BOOLEAN         NOT NULL    DEFAULT     FALSE,
    FOREIGN KEY (TeamA)         REFERENCES teams(TeamName),
    FOREIGN KEY (TeamB)         REFERENCES teams(TeamName)
);

DROP FUNCTION IF EXISTS user_active;
DROP FUNCTION IF EXISTS team_active;
DROP FUNCTION IF EXISTS game_active;

CREATE FUNCTION user_active (
    PUserName   VARCHAR(127)
) RETURNS BOOLEAN 
RETURN EXISTS (
    SELECT * FROM users 
        WHERE UserName = PUserName
        AND   TIMESTAMPDIFF(SECOND, LastUpdate, NOW()) < 300
);

DELIMITER .
CREATE FUNCTION team_active (
    PTeamName   VARCHAR(127)
) RETURNS BOOLEAN
BEGIN
    DECLARE PMemberA BOOLEAN;
    DECLARE PMemberB BOOLEAN;
    SET PMemberA = EXISTS(SELECT * FROM teams
        WHERE TeamName = PTeamName
        AND   user_active(MemberA));
    SET PMemberB = EXISTS(SELECT * FROM teams
        WHERE TeamName = PTeamName
        AND   user_active(MemberB));
    UPDATE teams SET MemberA = MemberB, MemberB = NULL 
                 WHERE NOT PMemberA AND PMemberB AND TeamName=PTeamName;
    RETURN PMemberA OR PMemberB;
END.
DELIMITER ;

DELIMITER .
CREATE FUNCTION game_active (
    PGameID    INT
) RETURNS BOOLEAN
BEGIN
    DECLARE PActiveA BOOLEAN;
    DECLARE PActiveB BOOLEAN;
    SET PActiveA = EXISTS(SELECT * FROM games
        WHERE GameID = PGameID
        AND   team_active(TeamA)
        AND   Active = TRUE);
    SET PActiveB = EXISTS(SELECT * FROM games
        WHERE GameID = PGameID
        AND   team_active(TeamB)
        AND   Active = TRUE);
    UPDATE games SET TeamA = TeamB, TeamB = NULL,
                     GlassesA = (@Glasses := GlassesA), GlassesA = GlassesB, GlassesB = @Glasses,
                     RackA = (@Rack := RackA), RackA = RackB, RackB = @Rack,
                     Turn = NOT Turn
                 WHERE NOT PActiveA AND PActiveB AND GameID = PGameID;
    UPDATE games SET Active = PActiveA OR PActiveB WHERE Active = TRUE AND GameID = PGameID;
    RETURN PActiveA OR PActiveB;
END.
DELIMITER ;

DROP PROCEDURE IF EXISTS end_game;

DELIMITER .
CREATE PROCEDURE end_game (
    PGameID    INT,
    PTeamLose  VARCHAR(127)
)
BEGIN
    IF EXISTS(SELECT TeamA FROM games WHERE GameID = PGameID AND NOT TeamA = PTeamLose) THEN
        SELECT TeamA FROM games WHERE GameID = PGameID INTO @PTeamWin;
    ELSE
        SELECT TeamB FROM games WHERE GameID = PGameID INTO @PTeamWin;
    END IF;
    UPDATE teams SET Wins = Wins + 1, MemberA = (@PMemberAWin := MemberA), MemberB = (@PMemberBWin := MemberB)
                 WHERE TeamName = @PTeamWin;
    UPDATE teams SET Loses = Loses + 1, MemberA = (@PMemberALose := MemberA), MemberB = (@PMemberBLose := MemberB)
                 WHERE TeamName = PTeamLose;
    UPDATE users SET Wins = Wins + 1 WHERE UserName = @PMemberAWin OR UserName = @PMemberBWin;
    UPDATE users SET Loses = Loses + 1 WHERE UserName = @PMemberALose OR UserName = @PMemberBLose;
    UPDATE games SET Active = FALSE WHERE GameID = PGameID;
END.
DELIMITER ;