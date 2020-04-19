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

    // DATABASE CONNECTION
    $servername = "localhost";
    $username   = "webserver";
    $password   = "BP4Life";
    $database   = "codenames";

    $conn = mysqli_connect($servername, $username, $password, $database);

    if ($conn) {
        $conn->query("LOCK TABLES colors WRITE, games WRITE, cells WRITE, users WRITE, teams WRITE, messages WRITE");

        if (!empty($_POST["Quit"])) {
            $sql = "UPDATE users SET LastUpdate=DATE_SUB(NOW(), INTERVAL 30 SECOND) WHERE ID='" . $_POST["ID"] . "' AND UserName='" . escape($_POST["UserName"]) . "'";
            $conn->query($sql);
            echo('Q');
        } else {
            $sql = "SELECT game_active('" . $_POST["ID"] . "') AS Active";
            if ($conn->query($sql)->fetch_assoc()["Active"]) {
                // SEND
                $sql = "UPDATE users SET LastUpdate=NOW(), UserStatus=UserStatus|1 WHERE ID='" . $_POST["ID"] . "' AND UserName='" . escape($_POST["UserName"]) . "'";
                $conn->query($sql);

                if ($_POST["Teams3"] !== NULL) {
                    $sql = "UPDATE games SET Teams3=" . $_POST["Teams3"] . " WHERE ID='" . $_POST["ID"] ."'";
                    $conn->query($sql);
                    if ($_POST["Teams3"] != "0") {
                        $sql = "CALL clear_color('" . $_POST["ID"] . "', 'yellow')";
                        $conn->query($sql);
                    }
                }
                if ($_POST["Ask"] !== NULL) {
                    if ($_POST["Ask"] == "true") $sql = "UPDATE teams SET Captain='" . escape($_POST["UserName"]) . "' WHERE ID='" . $_POST["ID"] . "' AND ColorID=" . $_POST["AskColor"];
                    else                         $sql = "UPDATE teams SET Captain=NULL WHERE ID='" . $_POST["ID"] . "' AND ColorID=" . $_POST["AskColor"];
                    $conn->query($sql);
                }
                if (!empty($_POST["Color"])) {
                    $sql = "UPDATE users SET ColorID=" . $_POST["Color"] . " WHERE ID='" . $_POST["ID"] . "' AND UserName='" . escape($_POST["UserName"]) . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["Order"])) {
                    $order = explode(";", $_POST["Order"]);
                    $sql = "UPDATE teams SET TeamOrder=" . $order[0] . " WHERE ID='" . $_POST["ID"] . "' AND ColorID=colorID('red')";
                    $conn->query($sql);
                    $sql = "UPDATE teams SET TeamOrder=" . $order[1] . " WHERE ID='" . $_POST["ID"] . "' AND ColorID=colorID('blue')";
                    $conn->query($sql);
                    if (count($order) > 2) {
                        $sql = "UPDATE teams SET TeamOrder=" . $order[2] . " WHERE ID='" . $_POST["ID"] . "' AND ColorID=colorID('yellow')";
                        $conn->query($sql);
                    }

                }
                if (!empty($_POST["Names"])) {
                    $cells = explode("`", $_POST["Names"]);
                    foreach ($cells as $cell) {
                        $values = explode(";", $cell);
                        $sql = "INSERT INTO cells(ID, X, Y, ColorID, Content) VALUES ('" . $_POST["ID"] . "', " . $values[0] . ", " . $values[1] .
                                ", " . $values[2] . ", '" . $values[3] . "')";
                        $conn->query($sql);
                    }
                }
                if (!empty($_POST["Start"])) {
                    $sql = "UPDATE games SET Timer=NOW(), GameState=1 WHERE ID='" . $_POST["ID"] . "'";
                    $conn->query($sql);
                    $sql = "CALL order_teams('" . $_POST["ID"] . "')";
                    $conn->query($sql);
                } else if (!empty($_POST["Pause"])) {
                    $sql = "UPDATE games SET LastPause=NOW(), GameState=2 WHERE ID='" . $_POST["ID"] . "'";
                    $conn->query($sql);
                } elseif (!empty($_POST["Unpause"])) {
                    $sql = "UPDATE games SET Timer=DATE_ADD(Timer, INTERVAL TIMESTAMPDIFF(SECOND, LastPause, NOW()) SECOND), GameState=1 WHERE ID='" . $_POST["ID"] . "'";
                    $conn->query($sql);
                } else if (!empty($_POST["Finish"])) {
                    $sql = "UPDATE games SET Timer=NOW(), GameState=3 WHERE ID='" . $_POST["ID"] . "'";
                    $conn->query($sql);
                } else if (!empty($_POST["Timeout"])) {
                    $sql = "UPDATE games SET GameState=4 WHERE ID='" . $_POST["ID"] . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["Playing"])) {
                    $sql = "UPDATE teams SET Playing=TRUE WHERE ID='" . $_POST["ID"] . "' AND ColorID=" . $_POST["ColorID"];
                    $conn->query($sql);
                    $sql = "UPDATE games SET Timer=NOW() WHERE ID='" . $_POST["ID"] . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["Pass"])) {
                    $sql = "UPDATE users SET Pass=TRUE WHERE ID='" . $_POST["ID"] . "' AND UserName='" . escape($_POST["UserName"]) . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["Select"])) {
                    $pos = explode(";", $_POST["Select"]);
                    $sql = "UPDATE users SET SX=" . $pos[0] . ", SY=" . $pos[1] . " WHERE ID='" . $_POST["ID"] . "' AND UserName='" . escape($_POST["UserName"]) . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["Tentative"])) {
                    $pos = explode(";", $_POST["Tentative"]);
                    $sql = "UPDATE cells SET Tentative=NOT Tentative WHERE ID='" . $_POST["ID"] . "' AND X=" . $pos[0] . " AND Y=" . $pos[1];
                    $conn->query($sql);
                }
                if ($_POST["GameTurn"] !== NULL) {
                    $sql = "UPDATE games SET Turn=" . $_POST["GameTurn"] . " WHERE ID='" . $_POST["ID"] . "'";
                    $conn->query($sql);
                }
                if ($_POST["UserStatus"] !== NULL) {
                    $sql = "UPDATE users SET UserStatus=UserStatus^" . $_POST["UserStatus"] . " WHERE UserName='" . escape($_POST["UserName"]) . "' AND ID='" . 
                                    $_POST["ID"] . "'";
                    $conn->query($sql);
                }
                if ($_POST["TeamTurn"] !== NULL) {
                    $sql = "UPDATE teams SET Turn=" . $_POST["TeamTurn"] . ", Playing=FALSE WHERE ColorID=" . $_POST["ColorID"] . " AND ID='" .  $_POST["ID"] . "'";
                    $conn->query($sql);
                    $sql = "UPDATE users SET Pass=FALSE, SX=NULL, SY=NULL WHERE ColorID=" . $_POST["ColorID"] . " AND ID='" .  $_POST["ID"] . "'";
                    $conn->query($sql);
                    $sql = "UPDATE cells SET Tentative=FALSE WHERE ID='" . $_POST["ID"] . "'";
                    $conn->query($sql);
                    $sql = "UPDATE games SET Timer=NOW() WHERE ID='" . $_POST["ID"] . "'";
                    $conn->query($sql);
                }
                if (!empty($_POST["Messages"])) {
                    $messages = explode("`", $_POST["Messages"]);
                    foreach ($messages as $message) {
                        $sql = "INSERT INTO messages(ID, UserName, Content) VALUES ('" . $_POST["ID"] . "', '" . escape($_POST["UserName"]) . "', '" .
                                escape($message) . "')";
                        $conn->query($sql);
                    }
                }
                if (!empty($_POST["Clear"])) {
                    $sql = "UPDATE users SET UserStatus=0 WHERE ID='" . $_POST["ID"] . "' AND TIMESTAMPDIFF(SECOND, LastUpdate, NOW())>30";
                    $conn->query($sql);
                }

                // RECEIVE
                $sql = "SELECT GameState, Turn, Timer, Teams3 FROM games WHERE ID='" . $_POST["ID"] . "'";
                $result = $conn->query($sql)->fetch_assoc();
                echo($result["GameState"] . ";" . $result["Turn"] . ";" . $result["Timer"] . ";" . $result["Teams3"] . "`");

                if (!empty($_POST["TimeSync"])) {
                    $sql = "SELECT NOW() AS Time";
                    $result = $conn->query($sql)->fetch_assoc();
                    echo("S;" . $result["Time"] . "`");
                }

                $sql = "SELECT * FROM users WHERE ID='" . $_POST["ID"] . "'";
                $query = $conn->query($sql);
                while ($result = $query->fetch_assoc()) {
                    echo("U;" . $result["UserName"] . ";" . $result["Host"] . ";" . $result["UserStatus"] . ";" . $result["SX"] . ";" . $result["SY"] . ";" .
                            $result["ColorID"] . ";" . $result["Pass"] . "`");
                }

                $sql = "SELECT * FROM teams WHERE ID='" . $_POST["ID"] . "' ORDER BY TeamOrder";
                $query = $conn->query($sql);
                while ($result = $query->fetch_assoc()) {
                   echo("T;" . $result["ColorID"] . ";" . $result["Captain"] . ";" . $result["Playing"] . ";" . $result["Turn"] . "`");
                }

                if (!empty($_POST["Colors"])) {
                    $sql = "SELECT * FROM colors";
                    $query = $conn->query($sql);
                    while ($result = $query->fetch_assoc()) {
                        echo("C;" . $result["ID"] . ";" . $result["Color"] . "`");
                    }
                }

                if (!empty($_POST["Cells"])) {
                    $sql = "SELECT * FROM cells WHERE ID='" . $_POST["ID"] . "'";
                    $query = $conn->query($sql);
                    while ($result = $query->fetch_assoc()) {
                        echo ("X;" . $result["X"] . ";" . $result["Y"] . ";" . $result["Content"] . ";" . $result["ColorID"] . ";" . $result["Discovered"] . ";" .
                             $result["Tentative"] . "`");
                    }
                }
                
                $sql = "SELECT MessageID, UserName, Content, TimeSent FROM messages WHERE MessageID>" . $_POST["LastMID"] . " AND ID='" . $_POST["ID"] . 
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