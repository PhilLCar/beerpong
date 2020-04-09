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
    $database   = "boulette";

    $conn = mysqli_connect($servername, $username, $password, $database);

    if ($conn) {
        $conn->query("LOCK TABLES lobbies WRITE, users WRITE, pairs WRITE, categories WRITE, names WRITE, messages WRITE");

        if (!empty($_POST["Quit"])) {
            $sql = "UPDATE users SET LastUpdate=DATE_SUB(NOW(), INTERVAL 30 SECOND) WHERE LobbyID='" . $_POST["LobbyID"] . "' AND UserName='" . escape($_POST["UserName"]) . "'";
            $conn->query($sql);
            echo('Q');
        } else {
            $sql = "SELECT game_active('" . $_POST["LobbyID"] . "') AS Active";
            if ($conn->query($sql)->fetch_assoc()["Active"]) {
                // SEND
                $sql = "UPDATE users SET LastUpdate=NOW() WHERE LobbyID='" . $_POST["LobbyID"] . "' AND UserName='" . escape($_POST["UserName"]) . "'";
                $conn->query($sql);

                if (!empty($_POST["GameState"])) {
                    $sql = "UPDATE lobbies SET GameState=" . $_POST["GameState"] . " WHERE LobbyID='" . $_POST["LobbyID"] . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["Timer"])) {
                    $sql = "UPDATE lobbies SET Timer='" . $_POST["Timer"] . "' WHERE LobbyID='" . $_POST["LobbyID"] . "'";
                    $conn->query($sql);
                }
                if ($_POST["GameTurn"] !== NULL) {
                    $sql = "UPDATE lobbies SET Turn=" . $_POST["GameTurn"] . " WHERE LobbyID='" . $_POST["LobbyID"] . "'";
                    $conn->query($sql);
                }
                if ($_POST["UserStatus"] !== NULL) {
                    $sql = "UPDATE users SET UserStatus=UserStatus^" . $_POST["UserStatus"] . " WHERE UserName='" . escape($_POST["UserName"]) . "' AND LobbyID='" . 
                                    $_POST["LobbyID"] . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["UserTurn"])) {
                    $sql = "UPDATE users SET Turn=" . $_POST["UserTurn"] . " WHERE UserName='" . escape($_POST["UserName"]) . "' AND LobbyID='" .  $_POST["LobbyID"] . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["Score"])) {
                    $sql = "UPDATE users SET Score=" . $_POST["Score"] . " WHERE UserName='" . escape($_POST["UserName"]) . "' AND LobbyID='" . $_POST["LobbyID"] . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["PairName"])) {
                    if(!empty($_POST["UserB"]) && $_POST["PairStatus"] == "New") {
                        $sql = "SELECT create_pair('" . $_POST["LobbyID"] . "', '" . escape($_POST["PairName"]) . "', '" . escape($_POST["UserName"]) . 
                                "', '" . escape($_POST["UserB"]) . "')";
                        $conn->query($sql);
                    } else if(!empty($_POST["UserB"]) && $_POST["PairStatus"] == "Append") {
                        $sql = "SELECT append_pair('" . $_POST["LobbyID"] . "', '" . escape($_POST["PairName"]) . "', '" . escape($_POST["UserB"]) . "')";
                        $conn->query($sql);
                    } else if($_POST["PairStatus"] == "Confirm") {
                        $sql = "CALL set_pair('" . $_POST["LobbyID"] . "', '" . escape($_POST["PairName"]) . "')";
                        $conn->query($sql);
                    } else if(!empty($_POST["UserB"]) && $_POST["PairStatus"] == "Delete") {
                        $sql = "CALL delete_pair('" . $_POST["LobbyID"] . "', '" . escape($_POST["PairName"]) . "')";
                        $conn->query($sql);
                    } else if ($_POST["PairStatus"] == "NotC") {
                        $sql = "CALL notc_pair('" . $_POST["LobbyID"] . "', '" . escape($_POST["PairName"]) . "')";
                        $conn->query($sql);
                    } else if ($_POST["PairStatus"] == "Playing") {
                        $sql = "UPDATE pairs SET Playing=" . $_POST["Playing"] . " WHERE LobbyID='". $_POST["LobbyID"] . "' AND PairName='" . escape($_POST["PairName"]) . "'";
                        $conn->query($sql);
                    }
                }
                if (!empty($_POST["CatName"]) && !empty($_POST["CatNew"])) {
                    $sql = "INSERT INTO categories(LobbyID, CatName, UserName) VALUES ('" . $_POST["LobbyID"] . "', '" . 
                                escape($_POST["CatName"]) . "', '" . escape($_POST["UserName"]) . "')";
                    $conn->query($sql);
                }
                if (!empty($_POST["Item"])) {
                    $sql = "INSERT INTO names(LobbyID, UserName, Item, CatName) VALUES ('" . $_POST["LobbyID"] . "', '" . escape($_POST["UserName"]) . "', '" .
                            escape($_POST["Item"]) . "', '" . escape($_POST["CatName"]) . "')";
                    $conn->query($sql);
                }
                if (!empty($_POST["UsedItem"])) {
                    $sql = "UPDATE names SET Used=TRUE WHERE LobbyID='" . $_POST["LobbyID"] . "' AND UserName='" . escape($_POST["UserName"]) . "' AND Item='" . escape($_POST["UsedItem"]) . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["Messages"])) {
                    $messages = explode("`", $_POST["Messages"]);
                    foreach ($messages as $message) {
                        $sql = "INSERT INTO messages(LobbyID, UserName, Content) VALUES ('" . $_POST["LobbyID"] . "', '" . escape($_POST["UserName"]) . "', '" .
                                escape($message) . "')";
                        $conn->query($sql);
                    }
                }
                if (!empty($_POST["Order"])) {
                    $sql = "CALL order_users('" . $_POST["LobbyID"] . "')";
                    $conn->query($sql);
                }
                if (!empty($_POST["RemoveInactive"])) {
                    $sql = "CALL clear_inactive('" . $_POST["LobbyID"] ."')";
                    $conn->query($sql);
                }

                // RECEIVE
                $sql = "SELECT GameState, Turn, Timer FROM lobbies WHERE LobbyID='" . $_POST["LobbyID"] . "'";
                $result = $conn->query($sql)->fetch_assoc();
                echo($result["GameState"] . ";" . $result["Turn"] . ";" . $result["Timer"] . "`");

                $sql = "SELECT UserName, Host, UserStatus, Score, Turn FROM users WHERE LobbyID='" . $_POST["LobbyID"] . "' ORDER BY UserOrder";
                $query = $conn->query($sql);
                while ($result = $query->fetch_assoc()) {
                    echo("U;" . $result["UserName"] . ";" . $result["Host"] . ";" . $result["UserStatus"] . ";" . $result["Score"] . ";" . $result["Turn"] . "`");
                }

                $sql = "SELECT PairName, UserA, UserB, UserC, Playing FROM pairs WHERE LobbyID='" . $_POST["LobbyID"] . "'";
                $query = $conn->query($sql);
                while ($result = $query->fetch_assoc()) {
                    echo("P;" . $result["PairName"] . ";" . $result["UserA"] . ";" . $result["UserB"] . ";" . $result["UserC"] . ";" . $result["Playing"] . "`");
                }

                if (!empty($_POST["RequestCat"])) {
                    $sql = "SELECT CatName, UserName FROM categories WHERE LobbyID='" . $_POST["LobbyID"] . "'";
                    $query = $conn->query($sql);
                    while ($result = $query->fetch_assoc()) {
                        echo("C;" . $result["UserName"] . ";" . $result["CatName"] . "`");
                    }
                }

                if (!empty($_POST["RequestItem"])) {
                    $sql = "SELECT Item FROM names WHERE LobbyID='" . $_POST["LobbyID"] . "' AND Used=FALSE ORDER BY RAND() LIMIT 1";
                    $item = $conn->query($sql)->fetch_assoc()["Item"];
                    $sql = "UPDATE names SET Used=TRUE WHERE Item='" . $item . "' AND LobbyID='" . $_POST["LobbyID"] . "'";
                    $conn->query($sql);
                    echo("I;" . $item . "`");
                }

                if (!empty($_POST["RequestItems"])) {
                    $sql = "SELECT Item FROM names WHERE LobbyID='" . $_POST["LobbyID"] . "' AND UserName='" . escape($_POST["UserName"]) . "'";
                    $query = $conn->query($sql);
                    while ($result = $query->fetch_assoc()) {
                        echo("I;" . $result["Item"] . "`");
                    }
                }
                
                $sql = "SELECT MessageID, UserName, Content, TimeSent FROM messages WHERE MessageID>" . $_POST["LastMID"] . " AND LobbyID='" . $_POST["LobbyID"] . 
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