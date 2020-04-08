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
                $sql = "SELECT user_active('" . escape($usr) . "') AS Active";
                if (!$conn->query($sql)->fetch_assoc()["Active"]) {
                    $sql = "UPDATE users SET LastUpdate=NOW(), UserStatus=0 WHERE LobbyID='" . $id . "' AND UserName='" . escape($usr) . "'";
                    $conn->query($sql);
                } else {
                    if (empty($_POST["LobbyID"])) header("Location: create.php?error=2");
                    else                          header("Location: join.php?error=2");
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
        </div>
        <div id="Unpaired">
            <div id="UnpairedTitle">NON-PAIRÉ.E.S</div>
        </div>
    </div>
    <div id="ChatWindow">
        <div id="MessageBoxTitle">MESSAGES</div>
        <div id="MessageBox">
        </div>
        <div id="Write">
            <input id="WriteBox" type="text" onkeypress="checkEnter(event)"/>
            <input id="WriteSend" type="button" value="Envoyer" onclick="sendMessage()"/>
        </div>
    </div>
  </body>
</html>