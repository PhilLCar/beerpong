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
        $game       = "Partie";
        $lobby      = "Salon";
        $teams      = "Équipes";
        $red        = "Rouge";
        $blue       = "Bleu";
        $yellow     = "Jaune";
        $start      = "DÉBUTER!";
        $teams3     = "3 ÉQUIPES";
        $quit       = "QUITTER";
        $send       = "Envoyer";
        $nomessages = "Aucun messages pour l'instant...";
        $ask        = "POSER";
        $nask       = "DEVINER";
        $unpause    = "REPRENDRE";
        $turn       = "TERMINER";
    } else {
        $game       = "Game";
        $lobby      = "Lobby";
        $teams      = "Teams";
        $red        = "Red";
        $blue       = "Blue";
        $yellow     = "Yellow";
        $start      = "START!";
        $teams3     = "3 TEAMS";
        $quit       = "QUIT";
        $send       = "Send";
        $nomessages = "No messages for now...";
        $ask        = "ASK";
        $nask       = "GUESS";
        $unpause    = "PLAY";
        $turn       = "END TURN";
    }

    $_POST["UserName"] = rmchars($_POST["UserName"], ";`");

    // DATABASE CONNECTION
    $servername = "localhost";
    $username   = "webserver";
    $password   = "BP4Life";
    $database   = "codenames";

    $conn = mysqli_connect($servername, $username, $password, $database);

    if ($conn) {
        if (empty($_POST["ID"]) && empty($_COOKIE["ID"])) {
            if (empty($_POST["UserName"])) {
                header("Location: create.php?error=1");
            }
            do {
                $alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                $id = "";
                for ($i = 0; $i < 4; $i++) {
                    $id .= $alphabet[rand(0, 25)];
                }

                $sql = "INSERT INTO games(ID) VALUES ('" . $id . "')";
            } while (!$conn->query($sql));
            $sql = "CALL game_init('" . $id . "')";
            $conn->query($sql);
        } else {
            if (empty($_COOKIE["ID"])) $id = strtoupper($_POST["ID"]);
            else $id = $_COOKIE["ID"];
        } 
        if (empty($_POST["UserName"])) {
            header("Location: join.php?error=1");
        } else if (empty($_COOKIE["UserName"])) {
            // Check validity of the game
            $sql = "SELECT * FROM games WHERE ID='" . $id . "'";
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
            $sql = "INSERT INTO users(ID, UserName, Host) VALUES ('" . $id . "', '" . escape($usr) . "', " . 
                        (empty($_POST["ID"]) ? "TRUE" : "FALSE") . ")";
            if (!$conn->query($sql)) {
                $sql = "SELECT user_active('" . $id . "', '" . escape($usr) . "') AS Active";
                if (!$conn->query($sql)->fetch_assoc()["Active"]) {
                    $sql = "UPDATE users SET LastUpdate=NOW(), UserStatus=0 WHERE ID='" . $id . "' AND UserName='" . escape($usr) . "'";
                    $conn->query($sql);
                } else {
                    if (empty($_POST["ID"])) header("Location: join.php?error=8");
                    else                          header("Location: join.php?error=16");
                    $conn->close();
                    exit();
                }
            }
            setcookie("ID", $id, time() + 86400, "/codenames");
            setcookie("UserName", $usr, time() + 86400, "/codenames");
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
    <title>CODE NAMES</title>
    <link rel="stylesheet" type="text/css" href="/css/codenames.css"/>
    <script type="text/javascript" src="/js/codenames.js"></script>
    <script>
        PARAMETER_LANG="<?php echo($_COOKIE["Language"]); ?>";
        STATE_ID="<?php echo($id); ?>";
        STATE_USERNAME="<?php echo($usr); ?>";
        update(1000);
    </script>
  </head>
  <body>
  <div id="TitleBar">
    <div id="Title">CODE NAMES</div>
    <div id="Timer">0:00</div>
    <div id="Game">#<?php echo($game); ?>: <b id="ID"><?php echo($id); ?></b></div>
  </div>
  <div id="Container">
        <div id="Lobby" class="Bar">
        <div id="LobbyTitleBar" class="TitleBar">
            <div id="LobbyExpMin" class="ExpMin" onclick="expMin('Lobby')">-</div>
            <div id="LobbyTitle" class="Title"><?php echo($lobby); ?></div>
        </div>
        <div id="LobbyList">
        </div>
        </div>
        <div id="TeamBar" class="Bar">
        <div id="TeamTitleBar" class="TitleBar">
            <div id="TeamExpMin" class="ExpMin" onclick="expMin('Team')">-</div>
            <div id="TeamTitle" class="Title"><?php echo($teams); ?></div>
        </div>
        <div id="TeamList">
            <div id="TeamRed" class="Team">
                <div id="TeamRedTitle" class="TeamTitle" onclick="sendColor('red')"><?php echo($red); ?></div>
                <div id="TeamRedList">
                </div>
            </div>
            <div id="TeamBlue" class="Team">
                <div id="TeamBlueTitle" class="TeamTitle" onclick="sendColor('blue')"><?php echo($blue); ?></div>
                <div id="TeamBlueList">
                </div>
            </div>
            <div id="TeamYellow" class="Team" hidden="true">
                <div id="TeamYellowTitle" class="TeamTitle" onclick="sendColor('yellow')"><?php echo($yellow); ?></div>
                <div id="TeamYellowList">
                </div>
            </div>
        </div>
        </div>
        <div id="GameBoard" hidden="true">
        <div id="R0" class="Row">
            <div id="C00" class="Cell" onclick="select(0,0)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C01" class="Cell" onclick="select(0,1)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C02" class="Cell" onclick="select(0,2)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C03" class="Cell" onclick="select(0,3)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C04" class="Cell" onclick="select(0,4)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
        </div>
        <div id="R1" class="Row">
            <div id="C10" class="Cell" onclick="select(1,0)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C11" class="Cell" onclick="select(1,1)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C12" class="Cell" onclick="select(1,2)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C13" class="Cell" onclick="select(1,3)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C14" class="Cell" onclick="select(1,4)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
        </div>
        <div id="R2" class="Row">
            <div id="C20" class="Cell" onclick="select(2,0)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C21" class="Cell" onclick="select(2,1)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C22" class="Cell" onclick="select(2,2)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C23" class="Cell" onclick="select(2,3)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C24" class="Cell" onclick="select(2,4)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
        </div>
        <div id="R3" class="Row">
            <div id="C30" class="Cell" onclick="select(3,0)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C31" class="Cell" onclick="select(3,1)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C32" class="Cell" onclick="select(3,2)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C33" class="Cell" onclick="select(3,3)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C34" class="Cell" onclick="select(3,4)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
        </div>
        <div id="R4" class="Row">
            <div id="C40" class="Cell" onclick="select(4,0)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C41" class="Cell" onclick="select(4,1)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C42" class="Cell" onclick="select(4,2)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C43" class="Cell" onclick="select(4,3)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
            <div id="C44" class="Cell" onclick="select(4,4)">
                <div class="Selectors"></div>
                <div class="Name">CODE NAMES</div>
            </div>
        </div>
        </div>
  </div>
  <div id="Chat" hidden="true">
      <div id="MessageTitle">Messages</div>
      <div id="Messages">
          <div style="padding: 1rem"><?php echo($nomessages); ?></div>
      </div>
      <div id="ChatBar">
          <textarea id="ChatInput" rows="1" onkeypress="checkEnter(event)"></textarea>
          <input id="ChatSend" type="button" value="<?php echo($send); ?>" onclick="sendMessage()"/>
      </div>
  </div>
  <div id="StatusBar">
      <div id="MessageButton" onclick="toggleChat()">
        <div id="MessageButtonText">Messages</div>
        <div id="MessageNotification" hidden="true">0</div>
      </div>
      <div id="Remaining"></div>
      <div id="TurnButton" class="BarButton" hidden="true" onclick="sendTurn()"><?php echo($turn); ?></div>
      <div id="NaskButton" class="BarButton" hidden="true" onclick="sendNask()"><?php echo($nask); ?></div>
      <div id="AskButton" class="BarButton" hidden="true" onclick="sendAsk()"><?php echo($ask); ?></div>
      <div id="UnpauseButton" class="BarButton" hidden="true" onclick="sendUnpause()"><?php echo($unpause); ?></div>
      <div id="PauseButton" class="BarButton" hidden="true" onclick="sendPause()">PAUSE</div>
      <div id="ThreeButton" class="BarButton" hidden="true" onclick="sendTeams3()"><?php echo($teams3); ?></div>
      <div id="StartButton" class="BarButton" hidden="true" onclick="sendStart()"><?php echo($start); ?></div>
      <div id="QuitButton"  class="BarButton" onclick="sendQuit()"><?php echo($quit); ?></div>
  </div>
  <div id="Error" hidden="true">
      <div id="InfoBubble">
        <div id="InfoBubbleIcon">!</div>
        <div id="InfoBubbleContent"></div>
        <input id=InfoBubbleButton" type="button" value="OK" onclick="closeError()"/>
      </div>
  </div>
  <div id="Mask" hidden="true">
      <div id="Dialog">...</div>
      <input id="DialogOK" type="button" onclick="closeDialog()" value="OK" hidden="true"/>
  </div>
  </body>
</html>