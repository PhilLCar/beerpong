<?php
  if ($_COOKIE["Language"] == "FR") {
    $dist = "DISTRIBUER!";
  } else {
    $dist = "DISTRIBUTE!";
  }

  if ($_COOKIE["GameID"]) {
    $id   = $_COOKIE["GameID"];
    $host = $_COOKIE["Host"];
  } else {
    // DATABASE CONNECTION
    $servername = "localhost";
    $username   = "webserver";
    $password   = "BP4Life";
    $database   = "uno";

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

          $sql = "INSERT INTO games (GameID) VALUES ('" . $id . "')";
        } while (!$conn->query($sql));
        $host = "true";
      } else {
        $id = strtoupper($_POST["GameID"]);
        $sql = "SELECT GameID, GameState FROM games WHERE GameID='" . $id . "'";
        $result = $conn->query($sql);
        if (!$result->num_rows) {
          header("Location: /uno?error=1");
        }
        if ($result->fetch_assoc()["GameState"]) {
          header("Location: /uno?error=4");
        }
      }
      $conn->close();
    } else {
      header("Location: /uno?error=2");
    }
  }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>UNO</title>
    <link rel="stylesheet" type="text/css" href="/css/uno.css"/>
    <script src="/js/uno.js" type="text/javascript"></script>
    <script>
      _GAMEID = "<?php echo($id); ?>";
      _HOST   = <?php echo($host); ?>;
      getUserName();
    </script>
  </head>
  <body onload="fitTable()" onresize="fitTable()">
    <div id="GameID"><?php echo($id); ?></div>
    <div id="Table">
      <div id="Distribute" class="button" hidden="true">
        <input type="button" value="<?php echo($dist); ?>" onclick="sendCommand('INIT', null, function(){})"/>
      </div>
      <svg width="600" height="600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs id="TableDefs">
        </defs>
        <g id="TableTransform" transform="">
        </g>
      </svg>
    </div>
    <div id="AnimationMask" hidden="true">
    </div>
  </body>
</html>