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
        $game   = "Partie";
        $lobby  = "Salon";
        $teams  = "Équipes";
        $red    = "Rouge";
        $blue   = "Bleu";
        $yellow = "Jaune";
        $start  = "DÉBUTER!";
        $teams3 = "3 ÉQUIPES";
    } else {
        $game   = "Game";
        $lobby  = "Lobby";
        $teams  = "Teams";
        $red    = "Red";
        $blue   = "Blue";
        $yellow = "Yellow";
        $start  = "START!";
        $teams3 = "3 TEAMS";
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
            <div class="User">
                <div class="Status StatusOffline"></div>
                <div id="User0" class="UserName">UserName</div>
            </div>
            <div class="User">
                <div class="Status StatusOnline"></div>
                <div id="User1" class="UserName">UserName</div>
            </div>
            <div class="User Me">
                <div class="Status StatusWriting"></div>
                <div id="User2" class="UserName">UserName</div>
            </div>
        </div>
        </div>
        <div id="TeamBar" class="Bar">
        <div id="TeamTitleBar" class="TitleBar">
            <div id="TeamExpMin" class="ExpMin" onclick="expMin('Team')">-</div>
            <div id="TeamTitle" class="Title"><?php echo($teams); ?></div>
        </div>
        <div id="TeamList">
            <div id="TeamRed" class="Team">
                <div id="TeamRedTitle" class="TeamTitle"><?php echo($red); ?></div>
                <div class="User">
                    <div class="Status StatusWriting"></div>
                    <div id="User3" class="UserName">UserName (P)</div>
                </div>
                <div class="User">
                    <div class="Status StatusWriting"></div>
                    <div id="User4" class="UserName">UserName</div>
                </div>
            </div>
            <div id="TeamBlue" class="Team">
                <div id="TeamBlueTitle" class="TeamTitle"><?php echo($blue); ?></div>
                <div class="User">
                    <div class="Status StatusWriting"></div>
                    <div id="User5" class="UserName">UserName (P)</div>
                </div>
                <div class="User">
                    <div class="Status StatusWriting"></div>
                    <div id="User6" class="UserName">UserName</div>
                </div>
            </div>
            <div id="TeamYellow" class="Team">
                <div id="TeamYellowTitle" class="TeamTitle"><?php echo($yellow); ?></div>
                <div class="User">
                    <div class="Status StatusWriting"></div>
                    <div id="User7" class="UserName">UserName (P)</div>
                </div>
                <div class="User">
                    <div class="Status StatusWriting"></div>
                    <div id="User8" class="UserName">UserName</div>
                </div>
            </div>
        </div>
        </div>
        <div id="GameBoard">
        <div id="R0" class="Row">
            <div id="C00" class="Cell" onclick="select(0,0)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C01" class="Cell" onclick="select(0,1)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C02" class="Cell" onclick="select(0,2)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C03" class="Cell" onclick="select(0,3)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C04" class="Cell" onclick="select(0,4)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
        </div>
        <div id="R1" class="Row">
            <div id="C10" class="Cell" onclick="select(1,0)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C11" class="Cell" onclick="select(1,1)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C12" class="Cell" onclick="select(1,2)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C13" class="Cell" onclick="select(1,3)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C14" class="Cell" onclick="select(1,4)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
        </div>
        <div id="R2" class="Row">
            <div id="C20" class="Cell" onclick="select(2,0)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C21" class="Cell" onclick="select(2,1)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C22" class="Cell" onclick="select(2,2)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C23" class="Cell" onclick="select(2,3)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C24" class="Cell" onclick="select(2,4)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
        </div>
        <div id="R3" class="Row">
            <div id="C30" class="Cell" onclick="select(3,0)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C31" class="Cell" onclick="select(3,1)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C32" class="Cell" onclick="select(3,2)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C33" class="Cell" onclick="select(3,3)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C34" class="Cell" onclick="select(3,4)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
        </div>
        <div id="R4" class="Row">
            <div id="C40" class="Cell" onclick="select(4,0)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C41" class="Cell" onclick="select(4,1)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C42" class="Cell" onclick="select(4,2)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C43" class="Cell" onclick="select(4,3)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C44" class="Cell" onclick="select(4,4)">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
        </div>
        </div>
  </div>
  <div id="ChatMask">
  </div>
  <div id="StatusBar">
      <div id="MessageButton">
        <div id="MessageButtonText">Messages</div>
        <div id="MessageNotification">2</div>
      </div>
      <div id="StartButton" class="BarButton"><?php echo($start); ?></div>
      <div id="ThreeButton" class="BarButton"><?php echo($teams3); ?></div>
  </div>
  </body>
</html>