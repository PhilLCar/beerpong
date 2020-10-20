<?php
  if ($_COOKIE["Language"] == "FR") {
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

  // DATABASE CONNECTION
	$servername = "localhost";
	$username   = "webserver";
	$password   = "BP4Life";
	$database   = "tron";

  $conn = mysqli_connect($servername, $username, $password, $database);
  $host = "false";
  if ($conn) {
    if (empty($_POST["GameID"])) {
      $id = "";
      do {
        $alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        $id = "";
        for ($i = 0; $i < 4; $i++) {
            $id .= $alphabet[rand(0, 25)];
        }

        $sql = "INSERT INTO tron (GameID) VALUES ('" . $id . "')";
      } while (!$conn->query($sql));
      $host = "true";
    } else {
      $id = strtoupper($_POST["GameID"]);
      $sql = "SELECT GameID FROM tron WHERE GameID='" . $id . "'";
      if (!$conn->query($sql)->num_rows) {
        header("Location: /tron");
      }
    }
    $conn->close();
  } else {
    header("Location: /tron");
  }
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