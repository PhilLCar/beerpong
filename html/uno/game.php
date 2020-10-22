<?php
  if ($_COOKIE["Language"] == "FR") {
    $dist = "DISTRIBUER!";
    $show = "VOIR";
    $hide = "CACHER";
    $sig  = "SIGNALER";
    $pick = "PIGE:";
  } else {
    $dist = "DISTRIBUTE!";
    $show = "SHOW";
    $hide = "HIDE";
    $sig  = "SIGNAL";
    $pick = "STACK:";
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
      function registerCustomEvent() {
        var wasin = false;
        document.onmousemove = function (event) {
          var e   = event || window.event;
          var fan = document.getElementById("Fan").getBoundingClientRect();
          if (e.clientX > fan.left  &&
              e.clientX < fan.right &&
              e.clientY > fan.top   &&
              e.clientY < fan.bottom) {
            wasin = true;
            fanCards();
          } else {
            if (wasin) {
              var mycards = document.getElementsByClassName("mine");
              for (var card of mycards) {
                if (card.matches(":hover")) return;
              }
              animateCloseHand();
            }
            wasin = false;
          }
        };
      };
    </script>
  </head>
  <body onload="fitTable();registerCustomEvent()" onresize="fitTable()">
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
      <div id="Deck" class="card" hidden="true" onclick="pick()">
        <img src="/resources/back.svg"/>
      </div>
      <div id="PlayDeck" class="card" hidden="true">
        <img src="/resources/back.svg" />
      </div>
    </div>
    <div id="AnimationMask" hidden="true">
    </div>
    <div id="Cards">
      <div id="Fan">
      </div>
    </div>
    <div id="ShowHideButton" value="1" alternate="<?php echo($hide); ?>" class="button">
      <input type="button" value="<?php echo($show) ?>" onclick="showHide(true)"/>
    </div>
    <div id="UnoButton" class="button" onclick="uno()">
      <input type="button" value="UNO"/>
    </div>
    <div id="SignalButton" class="button" onclick="signal()">
      <input type="button" value="<?php echo($sig) ?>"/>
    </div>
    <div id="Pick" hidden="true">
      <div id="PickTitle"><?php echo($pick); ?></div>
      <div id="PickNumber">8</div>
    </div>
  </body>
</html>