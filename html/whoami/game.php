<?php
    function rmchars($string, $chars) {
        $final = "";
        foreach (str_split($string) as $charA) {
            foreach (str_split($chars) as $charB) {
                if ($charA == $charB) continue 2;
            }
            $final .= $charA;
        }
        return $final;
    }

    function escape($string) {
        $final = "";
        foreach (str_split($string) as $charA) {
            if ($charA == "'") $final .= "\\";
            if ($charA == "\\") $final .= "\\";
            $final .= $charA;
        }
        return $final;
    }

    if ($_COOKIE["Language"] == "FR") {
      $title   = "Qui suis-je?";
      $game    = "PARTIE";
      $send    = "Envoyer";
      $start   = "Commencer!";
      $pause   = "Pause";
      $unpause = "Reprendre";
    } else {
      $title   = "Who am I?";
      $game    = "GAME";
      $send    = "Send";
      $start   = "Start!";
      $pause   = "Pause";
      $unpause = "Unpause";
    }

    $_POST["UserName"] = rmchars($_POST["UserName"], ";`");

    // DATABASE CONNECTION
    $servername = "localhost";
    $username   = "webserver";
    $password   = "BP4Life";
    $database   = "whoami";

    $conn = mysqli_connect($servername, $username, $password, $database);

    if ($conn) {
        if (empty($_POST["GameID"]) && empty($_COOKIE["GameID"])) {
            if (empty($_POST["UserName"])) {
                header("Location: create.php?error=1");
            }
            do {
                $alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                $id = "";
                for ($i = 0; $i < 4; $i++) {
                    $id .= $alphabet[rand(0, 25)];
                }

                $sql = "INSERT INTO games(GameID) VALUES ('" . $id . "')";
            } while (!$conn->query($sql));
        } else {
            if (empty($_COOKIE["GameID"])) $id = strtoupper($_POST["GameID"]);
            else $id = $_COOKIE["GameID"];
        }
        if (empty($_POST["UserName"])) {
            header("Location: join.php?error=1");
        } else if (empty($_COOKIE["UserName"])) {
            // Check validity of the game
            $sql = "SELECT * FROM games WHERE GameID='" . $id . "'";
            if ($result = $conn->query($sql)) {
                $state = $result->fetch_assoc()["GameState"];
                if ($state > 1 && $state != 2) {
                    header("Location: join.php?error=4");
                    $conn->close();
                    exit();
                } else if ($state == 2) {
                    $sql = "CALL order_users('" . $id . "')";
                    $conn->query($sql);
                }
            } else {
                header("Location: join.php?error=2");
                $conn->close();
                exit();
            }

            // try insert user
            $usr = $_POST["UserName"];
            $sql = "INSERT INTO users(GameID, UserName, Host) VALUES ('" . $id . "', '" . escape($usr) . "', " . 
                        (empty($_POST["GameID"]) ? "TRUE" : "FALSE") . ")";
            if (!$conn->query($sql)) {
                $sql = "SELECT user_active('" . $id . "', '" . escape($usr) . "') AS Active";
                if (!$conn->query($sql)->fetch_assoc()["Active"]) {
                    $sql = "UPDATE users SET LastUpdate=NOW(), UserStatus=0 WHERE GameID='" . $id . "' AND UserName='" . escape($usr) . "'";
                    $conn->query($sql);
                } else {
                    if (empty($_POST["GameID"])) header("Location: join.php?error=8");
                    else                          header("Location: join.php?error=16");
                    $conn->close();
                    exit();
                }
            }
            setcookie("GameID", $id, time() + 86400, "/whoami");
            setcookie("UserName", $usr, time() + 86400, "/whoami");
        } else {
            $usr = $_COOKIE["UserName"];
        }
        $conn->close();
    } else {
        header("Location: index.php?error=1");
    }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title><?php echo($title); ?></title>
    <link rel="stylesheet" type="text/css" href="/css/whoami.css"/>
    <script type="text/javascript" src="/js/whoami.js"></script>
    <script>
        PARAMETER_LANG="<?php echo($_COOKIE["Language"]); ?>";
        STATE_GAMEID="<?php echo($id); ?>";
        STATE_USERID="<?php echo($usr); ?>";
        update(1000);
    </script>
  </head>
  <body>
    <div id="Banner">
        <div id="BannerTitle"><?php echo($title); ?></div>
        <div id="Timer">15:00</div>
        <div id="GameID"><?php echo("#" . $game . ": <b>" . $id . "</b>"); ?></div>
        <div id="QuitGame" onclick="quitGame()">X</div>
    </div>
    <div id="GameContainer">
        <div id="PlayerDisplay">
        </div>
        <div id="MessageDisplay">
        </div>
        <div id="WriteBar">
            <input id="WriteInput" type="text" onkeypress="checkEnter(event)"/>
            <input id="WriteSend" type="button" value="<?php echo($send); ?>" onclick="sendMessage()"/>
            <input id="StartButton" hidden="true" type="button" value="<?php echo($start); ?>" onclick="startGame()"/>
            <input id="PauseButton" hidden="true" type="button" value="<?php echo($pause); ?>" onclick="pauseGame()"/>
            <input id="UnpauseButton" hidden="true" type="button" value="<?php echo($unpause); ?>" onclick="unpauseGame()"/>
        </div>
    </div>
  </body>
</html>