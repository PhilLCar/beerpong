CREATE DATABASE IF NOT EXISTS dice;

USE dice;

DROP TABLE IF EXISTS dice;

CREATE TABLE dice (
  SessionID             VARCHAR(4)      NOT NULL                    PRIMARY KEY,
  ThrowID               INT             NOT NULL                    DEFAULT 0,
  D1                    INT             NOT NULL                    DEFAULT 0,
  D1N                   INT             NOT NULL                    DEFAULT 0,
  D1S                   BOOLEAN         NOT NULL                    DEFAULT FALSE,
  D2                    INT             NOT NULL                    DEFAULT 1,
  D2N                   INT             NOT NULL                    DEFAULT 0,
  D2S                   BOOLEAN         NOT NULL                    DEFAULT FALSE,
  D3                    INT             NOT NULL                    DEFAULT 2,
  D3N                   INT             NOT NULL                    DEFAULT 0,
  D3S                   BOOLEAN         NOT NULL                    DEFAULT FALSE,
  D4                    INT             NOT NULL                    DEFAULT 3,
  D4N                   INT             NOT NULL                    DEFAULT 0,
  D4S                   BOOLEAN         NOT NULL                    DEFAULT FALSE,
  D5                    INT             NOT NULL                    DEFAULT 4,
  D5N                   INT             NOT NULL                    DEFAULT 0,
  D5S                   BOOLEAN         NOT NULL                    DEFAULT FALSE
);