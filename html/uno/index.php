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
  } else {
    $create  = "NEW GAME";
    $join    = "JOIN GAME";
    $ol      = "FR";
  }
  setcookie("UserName", "", time() - 86400, "/uno");
  setcookie("UserID",   "", time() - 86400, "/uno");
  setcookie("GameID",   "", time() - 86400, "/uno");
  setcookie("Host",     "", time() - 86400, "/uno");
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>UNO</title>
    <link rel="stylesheet" type="text/css" href="/css/uno.css"/>
    <script src="/js/uno.js" type="text/javascript"></script>
  </head>
  <body>
    <div id="MainMenu">
      <!-- <div id="Title" class="uno">
        <div class="unoContainer">
          <div class="unoCircle">
            <div class="unoText">UNO</div>
          </div>
        </div>
      </div> -->
      <img id="Title" src="/resources/uno.png"/>
      <div class="button">
        <input type="button" value="<?php echo($create); ?>"  onclick="window.location='game.php'"/>
      </div>
      <div class="button">
        <input type="button" value="<?php echo($join); ?>"    onclick="showJoin()"/>
      </div>
      <form action="game.php" method="POST">
        <input type="text" name="GameID" hidden="true"/><br>
        <input id="SubmitButton" type="submit" value="OK" hidden="true"/>
      </form>
    </div>
    <div id="Help"  class="mbutton" onclick="window.location='help.php'">?</div>
    <div id="Back"  class="mbutton" onclick="window.location='/'"><</div>
    <div id="Lang"  class="mbutton" onclick="window.location='.?lang=<?php echo($ol); ?>'"><?php echo($ol); ?></div>
  </body>
</html>