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
      $title  = "Qui suis-je?";
      $send   = "Envoyer";
      $start  = "Commencer!";
    } else {
      $title  = "Who am I?";
      $send   = "Send";
      $start  = "Start!";
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
                if ($state > 1 && !($state & 64)) { // CHANGE THE PAUSING LOGIC
                    header("Location: join.php?error=4");
                    $conn->close();
                    exit();
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
        PARAMETER_LANG=<?php echo($_COOKIE["Language"]); ?>
        STATE_GAMEID=<?php echo($id); ?>
        STATE_USERID=<?php echo($usr); ?>
        //update(1000);
    </script>
  </head>
  <body>
    <div id="Banner">
        <div id="BannerTitle"><?php echo($title); ?></div>
        <div id="Timer">15:00</div>
        <div id="GameID">#PARTIE: <b><?php echo($id); ?></b></div>
        <div id="QuitGame" onclick="window.location='.'">X</div>
    </div>
    <div id="GameContainer">
        <div id="PlayerDisplay">
            <div class="Player">
                <div class="PlayerStatus Online"></div>
                <div class="PlayerName">Player 1</div>
                <div class="PlayerIdent">(Einstein)</div>
                <div class="PlayerScore">0 pts</div>
            </div>
            <div class="Player">
                <div class="PlayerStatus Writing"></div>
                <div class="PlayerName">Player 2</div>
                <div class="PlayerIdent">(Einstein)</div>
                <div class="PlayerScore">0 pts</div>
            </div>
            <div class="Player Playing">
                <div class="PlayerStatus Active"></div>
                <div class="PlayerName">Player 3</div>
                <div class="PlayerIdent">(Einstein)</div>
                <div class="PlayerScore">0 pts</div>
            </div>
            <div class="Player">
                <div class="PlayerStatus Offline"></div>
                <div class="PlayerName">Player 4</div>
                <div class="PlayerIdent">(Einstein)</div>
                <div class="PlayerScore">0 pts</div>
            </div>
            <div class="Player">
                <div class="PlayerStatus Online"></div>
                <div class="PlayerName">Player 5</div>
                <div class="PlayerIdent">(Einstein)</div>
                <div class="PlayerScore">0 pts</div>
            </div>
        </div>
        <div id="MessageDisplay">
            <div class="Message">
                <div class="MessagePlayer">Player 1</div>
                <div class="MessageTime">00:43</div>
                Blablbalbalbalabalbabalbalbalablabalbaalblabalbabala
            </div>
            <div class="Message Mine">
                <div class="MessagePlayer">Player 1</div>
                <div class="MessageTime">00:43</div>
                Blablbalbalbalabalbabalbalbalablabalbaalblabalbabala
            </div>
            <div class="Message">
                <div class="MessagePlayer">Player 1</div>
                <div class="MessageTime">00:43</div>
                Blablbalbalbalabalbabalbalbalablabalbaalblabalbabala
            </div>
            <div class="Message Mine">
                <div class="MessagePlayer">Player 1</div>
                <div class="MessageTime">00:43</div>
                Blablbalbalbalabalbabalbalbalablabalbaalblabalbabala
            </div>
        </div>
        <div id="WriteBar">
            <input id="WriteInput" type="text"/>
            <input id="WriteSend" type="button" value="<?php echo($send); ?>"/>
            <input id="GameButton" class="StartGame" hidden="true" type="button" value="<?php echo($start); ?>"/>
        </div>
    </div>
  </body>
</html>