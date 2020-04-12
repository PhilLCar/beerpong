<?php
    function escape($string) {
        $final = "";
        foreach (str_split($string) as $charA) {
            if ($charA == "'") $final .= "\\";
            if ($charA == "\\") $final .= "\\";
            $final .= $charA;
        }
        return $final;
    }

    // DATABASE CONNECTION
    $servername = "localhost";
    $username   = "webserver";
    $password   = "BP4Life";
    $database   = "whoami";

    $conn = mysqli_connect($servername, $username, $password, $database);

    if ($conn) {
        $conn->query("LOCK TABLES games WRITE, users WRITE, messages WRITE");

        if (!empty($_POST["Quit"])) {
            $sql = "UPDATE users SET LastUpdate=DATE_SUB(NOW(), INTERVAL 30 SECOND) WHERE GameID='" . $_POST["GameID"] . "' AND UserName='" . escape($_POST["UserName"]) . "'";
            $conn->query($sql);
            echo('Q');
        } else {
            $sql = "SELECT game_active('" . $_POST["GameID"] . "') AS Active";
            if ($conn->query($sql)->fetch_assoc()["Active"]) {
                // SEND
                $sql = "UPDATE users SET LastUpdate=NOW(), UserStatus=UserStatus|1 WHERE GameID='" . $_POST["GameID"] . "' AND UserName='" . escape($_POST["UserName"]) . "'";
                $conn->query($sql);

                if (!empty($_POST["Start"])) {
                    $sql = "UPDATE games SET Timer=NOW(), GameState=1 WHERE GameID='" . $_POST["GameID"] . "'";
                    $conn->query($sql);
                    $sql = "CALL order_users('" . $_POST["GameID"] . "')";
                    $conn->query($sql);
                } else if (!empty($_POST["Pause"])) {
                    $sql = "UPDATE games SET LastPause=NOW(), GameState=2 WHERE GameID='" . $_POST["GameID"] . "'";
                    $conn->query($sql);
                } elseif (!empty($_POST["Unpause"])) {
                    $sql = "UPDATE games SET Timer=DATE_ADD(Timer, INTERVAL TIMESTAMPDIFF(SECOND, LastPause, NOW()) SECOND), GameState=1 WHERE GameID='" . $_POST["GameID"] . "'";
                    $conn->query($sql);
                } else if (!empty($_POST["Finish"])) {
                    $sql = "UPDATE games SET Timer=NOW(), GameState=3 WHERE GameID='" . $_POST["GameID"] . "'";
                    $conn->query($sql);
                } else if (!empty($_POST["Timeout"])) {
                    $sql = "UPDATE games SET GameState=4 WHERE GameID='" . $_POST["GameID"] . "'";
                    $conn->query($sql);
                }
                if ($_POST["GameTurn"] !== NULL) {
                    $sql = "UPDATE games SET Turn=" . $_POST["GameTurn"] . " WHERE GameID='" . $_POST["GameID"] . "'";
                    $conn->query($sql);
                }
                if ($_POST["UserStatus"] !== NULL) {
                    $sql = "UPDATE users SET UserStatus=UserStatus^" . $_POST["UserStatus"] . " WHERE UserName='" . escape($_POST["UserName"]) . "' AND GameID='" . 
                                    $_POST["GameID"] . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["UserTurn"])) {
                    $sql = "UPDATE users SET Turn=" . $_POST["UserTurn"] . " WHERE UserName='" . escape($_POST["UserName"]) . "' AND GameID='" .  $_POST["GameID"] . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["Score"])) {
                    $sql = "UPDATE users SET Score=" . $_POST["Score"] . " WHERE UserName='" . escape($_POST["UserName"]) . "' AND GameID='" . $_POST["GameID"] . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["Messages"])) {
                    $messages = explode("`", $_POST["Messages"]);
                    foreach ($messages as $message) {
                        $sql = "INSERT INTO messages(GameID, UserName, Content) VALUES ('" . $_POST["GameID"] . "', '" . escape($_POST["UserName"]) . "', '" .
                                escape($message) . "')";
                        $conn->query($sql);
                    }
                }
                if (!empty($_POST["Clear"])) {
                    $sql = "UPDATE users SET UserStatus=0 WHERE NOT user_active(GameID, UserName)";
                    $conn->query($sql);
                }

                // RECEIVE
                $sql = "SELECT GameState, Turn, Timer FROM games WHERE GameID='" . $_POST["GameID"] . "'";
                $result = $conn->query($sql)->fetch_assoc();
                echo($result["GameState"] . ";" . $result["Turn"] . ";" . $result["Timer"] . "`");

                $sql = "SELECT UserName, Host, UserStatus, Score, Turn, UserGiven, UserChoosing FROM users WHERE GameID='" . $_POST["GameID"] . "' ORDER BY UserOrder";
                $query = $conn->query($sql);
                while ($result = $query->fetch_assoc()) {
                    echo("U;" . $result["UserName"] . ";" . $result["Host"] . ";" . $result["UserStatus"] . ";" . $result["Score"] . ";" . $result["Turn"] . ";" .
                            $result["UserGiven"] . ";" . $result["UserChoosing"] . "`");
                }
                
                $sql = "SELECT MessageID, UserName, Content, TimeSent FROM messages WHERE MessageID>" . $_POST["LastMID"] . " AND GameID='" . $_POST["GameID"] . 
                        "' ORDER BY MessageID";
                $query = $conn->query($sql);
                while ($result = $query->fetch_assoc()) {
                    echo("M;" . $result["MessageID"] . ";" . $result["UserName"] . ";" . $result["TimeSent"] . ";" . $result["Content"] . "`");
                }
            } else {
                echo('F');
            }
        }

        $conn->query("UNLOCK TABLES");
        $conn->close();
    } 
?>