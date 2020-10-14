<?php
  $lang = NULL;

  if (!empty($_GET["lang"])) {
    $lang = $_GET["lang"];
    setcookie("Language", $lang, time() + 86400 * 30, "/");
  } else if (empty($_COOKIE["Language"])) {
    setcookie("Language", "EN", time() + 86400 * 30, "/");
    $lang = "EN";
  } else {
    $lang = $_COOKIE["Language"];
  }

  if ($lang == "FR") {
    $create  = "NOUVELLE PARTIE";
    $join    = "REJOINDRE UNE PARTIE";
    $ol      = "EN";
    $approve = "VOUS ALLEZ VOUS DEMATERIALISER ET ENTRER DANS L'ORDINATEUR. ETES VOUS CERTAIN?";
    $enter   = "OUI";
  } else {
    $create  = "NEW GAME";
    $join    = "JOIN GAME";
    $ol      = "FR";
    $approve = "YOU ARE ABOUT TO BE DEMATERIALIZED AND ENTER THE GRID. DO YOU WISH TO PROCEED?";
    $enter   = "YES";
  }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>TRON</title>
    <link rel="stylesheet" type="text/css" href="/css/tron.css"/>
    <script src="/js/tron.js" type="text/javascript"></script>
  </head>
  <body onload="placeVLines()" onresize="placeVLines()">
    <audio id="Track1" src="/audio/The Son of Flynn.mp3" preload="auto" onended="_PLAYING = document.getElementById('Track2'); _PLAYING.play()"></audio>
    <audio id="Track2" src="/audio/End of Line.mp3"      preload="auto" onended="_PLAYING = document.getElementById('Track3'); _PLAYING.play()"></audio>
    <audio id="Track3" src="/audio/Solar Sailor.mp3"     preload="auto" onended="_PLAYING = document.getElementById('Track1'); _PLAYING.play()"></audio>
    <div id="AudioPopUp">
      <div id="AudioPopUpContainer">
        <div id="AudioPopUpText"><?php echo($approve); ?></div>
        <input type="button" onclick="playMusic()" value="<?php echo($enter); ?>"/>
      </div>
    </div>
    <div id="MainMenu">
      <div>
        <h1 id="MainMenuTitle">TRON</h1>
        <input type="button" value="<?php echo($create); ?>"  onclick="window.location='game.php'"/>
        <input type="button" value="<?php echo($join); ?>"    onclick="showJoin()"/>
        <form action="game.php" method="POST">
          <input type="text" name="GameID" hidden="true"/><br>
          <input id="SubmitButton" type="submit" value="OK" hidden="true"/>
        </form>
      </div>
    </div>
    <div id="Lines">
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
      <div class="hline"></div>
    </div>
    <div id="MButtons">
      <div id="Music" class="mbutton" onclick="togglePlaying()">M</div>
      <div id="Help"  class="mbutton" onclick="window.location='help.php'">?</div>
      <div id="Back"  class="mbutton" onclick="window.location='/'"><</div>
      <div id="Lang"  class="mbutton" onclick="window.location='.?lang=<?php echo($ol); ?>'"><?php echo($ol); ?></div>
    </div>
  </body>
</html>