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
            $id = $_POST["LobbyID"];
        }
        if (empty($_COOKIE["LobbyID"]) || empty($_COOKIE["UserName"])) {
            // try insert user
            $usr = $_POST["UserName"];
            $sql = "INSERT INTO users(LobbyID, UserName, Host) VALUES ('" . $id . "', '" . escape($usr) . "', " . 
                        (empty($_POST["LobbyID"]) ? "TRUE" : "FALSE") . ")";
            if (!$conn->query($sql)) {
                if (empty($_POST["LobbyID"])) header("Location: create.php?error=2");
                else                          header("Location: join.php?error=2");
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
        window.setInterval(update, 1000);
    </script>
  </head>
  <body>
    <div id="Mask" hidden="true">
    </div>
    <div id="LobbyTitle">
        LA BOULETTE
        <div id="GlobalTime">15:00</div>
        <div id="LobbyID">#SALON: <b class="LobbyID"><?php echo($id); ?></b></div>
    </div>
    <div id="SideBar">
        <div id="Paired">
            <div id="PairedTitle">PAIRÉ.E.S</div>
            <div id="Pair1" class="Pair">
                <div class="PairTitle" onclick="hidePair(1)">
                    <div class="Status StatusPlaying">J</div>
                    DemoPair1
                    <div class="PairTime">15:00</div>
                </div>
                <div class="PairItem">
                    <div class="Status StatusAsking">P</div>
                    User1
                </div>
                <div class="PairItem">
                    <div class="Status StatusGuessing">D</div>
                    User2
                </div>
            </div>
            <div id="Pair2" class="Pair">
                <div class="PairTitle" onclick="hidePair(2)">
                    <div class="Status StatusWaiting">A</div>
                    DemoPair2
                </div>
                <div class="PairItem">
                    <div class="Status StatusWaiting">A</div>
                    User3
                </div>
                <div class="PairItem">
                    <div class="Status StatusWaiting">A</div>
                    User4
                </div>
            </div>
        </div>
        <div id="Unpaired">
            <div id="UnpairedTitle">NON-PAIRÉ.E.S</div>
            <div class="User">
                <div class="Status StatusWriting">...</div>
                User 5
            </div>
            <div class="User Me">
                <div class="Status StatusUnpaired">N</div>
                User 6
            </div>
        </div>
    </div>
    <div id="ChatWindow">
        <div id="MessageBoxTitle">MESSAGES</div>
        <div id="MessageBox">
        </div>
        <div id="Write">
            <input id="WriteBox" type="text"/>
            <input id="WriteSend" type="button" value="Envoyer"/>
        </div>
    </div>
  </body>
</html>