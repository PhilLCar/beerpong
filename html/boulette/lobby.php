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

    $_POST["UserName"] = rmchars($_POST["UserName"], ";`");

    // DATABASE CONNECTION
    $servername = "localhost";
    $username   = "webserver";
    $password   = "BP4Life";
    $database   = "boulette";

    $conn = mysqli_connect($servername, $username, $password, $database);

    if ($conn) {
        if (empty($_POST["LobbyID"]) && empty($_COOKIE["LobbyID"])) {
            if (empty($_POST["UserName"])) {
                header("Location: create.php?error=1");
            }
            do {
                $alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                $id = "";
                for ($i = 0; $i < 4; $i++) {
                    $id .= $alphabet[rand(0, 25)];
                }

                $sql = "INSERT INTO lobbies(LobbyID) VALUES ('" . $id . "')";
            } while (!$conn->query($sql));
        } else if (empty($_POST["UserName"])) {
            header("Location: join.php?error=1");
        } else {
            $id = strtoupper($_POST["LobbyID"]);
        }
        if (empty($_COOKIE["LobbyID"]) && empty($_COOKIE["UserName"])) {
            // Check validity of the game
            $sql = "SELECT * FROM lobbies WHERE LobbyID='" . $id . "'";
            if ($result = $conn->query($sql)) {
                $state = $result->fetch_assoc()["GameState"];
                if ($state > 1) {
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
            $sql = "INSERT INTO users(LobbyID, UserName, Host) VALUES ('" . $id . "', '" . escape($usr) . "', " . 
                        (empty($_POST["LobbyID"]) ? "TRUE" : "FALSE") . ")";
            if (!$conn->query($sql)) {
                $sql = "SELECT user_active('" . $id . "', '" . escape($usr) . "') AS Active";
                if (!$conn->query($sql)->fetch_assoc()["Active"]) {
                    $sql = "UPDATE users SET LastUpdate=NOW(), UserStatus=0 WHERE LobbyID='" . $id . "' AND UserName='" . escape($usr) . "'";
                    $conn->query($sql);
                } else {
                    if (empty($_POST["LobbyID"])) header("Location: create.php?error=2");
                    else                          header("Location: join.php?error=2");
                    $conn->close();
                    exit();
                }
            }
            setcookie("LobbyID", $id, time() + 86400, "/boulette");
            setcookie("UserName", $usr, time() + 86400, "/boulette");
        } else {
            $id  = $_COOKIE["LobbyID"];
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
    <title>Salon de discussion</title>
    <link rel="stylesheet" type="text/css" href="/css/boulette.css"/> 
    <script type="text/javascript" src="/js/boulette.js"></script>
    <script>
        LOBBY_ID = "<?php echo($id); ?>";
        USERNAME = "<?php echo($usr); ?>";
        update(1000);
    </script>
  </head>
  <body>
    <div id="Mask" class="Mask" hidden="true">
    </div>
    <div id="CatMask" class="Mask" hidden="true">
        <div id="CurrentCats">
            <div id="CurentCatsTitle">Catégories choisies jusqu'à présent:</div>
        </div>
        <div id="CatsInputDiv">
            Choisissez un nom de catégorie:<br>
            <input id="CatsInput" type="text"/>
            <input id="CatsButton" type="button" value="OK!" onclick="sendCat()"/>
        </div>
    </div>
    <div id="WordMask" class="Mask" hidden="true">
        <div id="WordContent">
            Choisissez un mot dans la catégorie<br><div id="WordCat"></div><br>
            <input id="WordInput" type="text"/>
            <input id="WordSend" type="button" value="OK!" onclick="sendWord()"/>
        </div>
    </div>
    <div id="GameMask" class="Mask" hidden="true">
        <div id="GameTimer" class="Timer">00:45</div>
        <div id="GameDialog" class="Dialog">
            Cliquez quand vous êtes prêt à commencer!<br>
            <input id="GameStartButton" type="button" value="GO!" onclick="startTurn()"/>
        </div>
        <div id="GameBoard" hidden="true">
        </div>
    </div>
    <div id="GuessMask" class="Mask" hidden="true">
        <div id="GuessTimer" class="Timer">00:45</div>
        <div id="GuessDialog" class="Dialog">
            Préparez-vous à deviner!
        </div>
    </div>
    <div id="LobbyTitle">
        LA BOULETTE
        <div id="GlobalTime">15:00</div>
        <div id="LobbyID">#SALON: <b class="LobbyID"><?php echo($id); ?></b></div>
    </div>
    <div id="SideBar">
        <div id="Paired">
            <div id="PairedTitle">PAIRÉ.E.S</div>
        </div>
        <div id="Categories" hidden="true">
            <div id="CatTitle">CATÉGORIES</div>
        </div>
        <div id="Unpaired">
            <div id="UnpairedTitle">NON-PAIRÉ.E.S</div>
        </div>
    </div>
    <div id="ChatWindow">
        <div id="MessageBoxTitle">MESSAGES</div>
        <div id="MessageBox">
            <div style="margin-top: 200px; text-align: center; width:100%">Aucun message pour l'instant</div>
        </div>
        <div id="Write">
            <input id="WriteBox" type="text" onkeypress="checkEnter(event)"/>
            <input id="WriteSend" type="button" value="Envoyer" onclick="sendMessage()"/>
        </div>
    </div>
  </body>
</html>