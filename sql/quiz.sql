CREATE DATABASE IF NOT EXISTS quiz;

USE quiz;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS samples;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS labels;
DROP TABLE IF EXISTS slides;
DROP TABLE IF EXISTS presentations;

CREATE TABLE presentations (
  PresentationID        INT             NOT NULL  AUTO_INCREMENT    PRIMARY KEY,
  Presenting            BOOLEAN         NOT NULL                    DEFAULT FALSE,
  Title                 VARCHAR(256)    NOT NULL,
  PassHash              VARCHAR(32)     NOT NULL,
  Slide                 INT             NOT NULL                    DEFAULT 0,
  LastUpdate            TIMESTAMP       NOT NULL                    DEFAULT NOW()
);

CREATE TABLE users (
  PresentationID        INT               NOT NULL,
  UserName              VARCHAR(128)      NOT NULL,
  Points                FLOAT(5,2)        NOT NULL        DEFAULT 000.00,
  LastUpdate            TIMESTAMP         NOT NULL        DEFAULT NOW(),
  PRIMARY KEY           (PresentationID, UserName),
  FOREIGN KEY           (PresentationID)  REFERENCES      presentations(PresentationID)
);

CREATE TABLE slides (
  PresentationID        INT               NOT NULL,
  SlideID               INT               NOT NULL  AUTO_INCREMENT,
  SlidePosition         INT               NOT NULL                  DEFAULT 0,
  SlideTime             INT               NOT NULL                  DEFAULT 0,
  Comments              VARCHAR(1024)     NOT NULL                  DEFAULT "",
  LastUpdate            TIMESTAMP         NOT NULL                  DEFAULT NOW(),
  PRIMARY KEY           (PresentationID, SlideID),
  FOREIGN KEY           (PresentationID)  REFERENCES                presentations(PresentationID),
  INDEX                 (SlideID)
);

CREATE TABLE labels (
  PresentationID        INT               NOT NULL,
  SlideID               INT               NOT NULL,
  LabelID               INT               NOT NULL  AUTO_INCREMENT,
  Selected              BOOLEAN           NOT NULL                  DEFAULT FALSE,
  Content               VARCHAR(8192)     NOT NULL                  DEFAULT "",
  Color                 VARCHAR(64)       NOT NULL                  DEFAULT "black",
  FontSize              INT               NOT NULL                  DEFAULT 20,
  X                     FLOAT(5,2)        NOT NULL                  DEFAULT 000.00,
  Y                     FLOAT(5,2)        NOT NULL                  DEFAULT 000.00,
  PRIMARY KEY           (PresentationID, SlideID, LabelID),
  FOREIGN KEY           (PresentationID)  REFERENCES                presentations(PresentationID),
  FOREIGN KEY           (SlideID)         REFERENCES                slides(SlideID),
  INDEX                 (LabelID)
);

CREATE TABLE images (
  PresentationID        INT               NOT NULL,
  SlideID               INT               NOT NULL,
  ImageID               INT               NOT NULL  AUTO_INCREMENT,
  Selected              BOOLEAN           NOT NULL                  DEFAULT FALSE,
  Content               VARCHAR(1024)     NOT NULL                  DEFAULT "",
  FontSize              INT               NOT NULL                  DEFAULT 20,
  X                     FLOAT(5,2)        NOT NULL                  DEFAULT 000.00,
  Y                     FLOAT(5,2)        NOT NULL                  DEFAULT 000.00,
  SizeX                 FLOAT(5,2)        NOT NULL                  DEFAULT 000.00,
  SizeY                 FLOAT(5,2)        NOT NULL                  DEFAULT 000.00,
  PRIMARY KEY           (PresentationID, SlideID, ImageID),
  FOREIGN KEY           (PresentationID)  REFERENCES                presentations(PresentationID),
  FOREIGN KEY           (SlideID)         REFERENCES                slides(SlideID),
  INDEX                 (ImageID)
);

CREATE TABLE samples (
  PresentationID        INT               NOT NULL,
  SlideID               INT               NOT NULL,
  SampleID              INT               NOT NULL  AUTO_INCREMENT,
  Selected              BOOLEAN           NOT NULL                  DEFAULT FALSE,
  Content               VARCHAR(1024)     NOT NULL                  DEFAULT "",
  FontSize              INT               NOT NULL                  DEFAULT 20,
  X                     FLOAT(5,2)        NOT NULL                  DEFAULT 000.00,
  Y                     FLOAT(5,2)        NOT NULL                  DEFAULT 000.00,
  PRIMARY KEY           (PresentationID, SlideID, SampleID),
  FOREIGN KEY           (PresentationID)  REFERENCES                presentations(PresentationID),
  FOREIGN KEY           (SlideID)         REFERENCES                slides(SlideID),
  INDEX                 (SampleID)
);