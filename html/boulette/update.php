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

    // DATABASE CONNECTION
    $servername = "localhost";
    $username   = "webserver";
    $password   = "BP4Life";
    $database   = "boulette";

    $conn = mysqli_connect($servername, $username, $password, $database);

    if ($conn) {
        $conn->query("LOCK TABLES lobbies WRITE, users WRITE, pairs WRITE, categories WRITE, names WRITE, messages WRITE");

        // SEND
        if (!empty($_POST["GameState"]) && !empty($_POST["Timer"])) {
            $sql = "UPDATE lobbies SET GameState=" . $_POST["GameState"] . ", Timer='" . $_POST["Timer"] . "' WHERE LobbyID='" . $_POST["LobbyID"] . "'";
            $conn->query($sql);
        }
        if (!empty($_POST["UserStatus"])) {
            // toggle UserStatus
            $sql = "UPDATE users SET UserStatus=UserStatus^" . $_POST["UserStatus"] . " WHERE UserName='" . $_POST["UserName"] . "' AND LobbyID='" . 
                            $_POST["LobbyID"] . "'";
            $conn->query($sql);
        }
        if (!empty($_POST["Score"])) {
            $sql = "UPDATE users SET Score=" . $_POST["Score"] . " WHERE UserName='" . $_POST["UserName"] . "' AND LobbyID='" . $_POST["LobbyID"] . "'";
            $conn->query($sql);
        }
        if (!empty($_POST["PairName"])) {
            if(!empty($_POST["UserB"]) && $_POST["PairStatus"] == "New") {
                $sql = "SELECT create_pair('" . $_POST["LobbyID"] . "', '" . $_POST["PairName"] . "', '" . $_POST["UserName"] . "', '" . $_POST["UserB"] . "')";
                $conn->query($sql);
            } else if(!empty($_POST["UserB"]) && $_POST["PairStatus"] == "Append") {
                $sql = "SELECT append_pair('" . $_POST["LobbyID"] . "', '" . $_POST["PairName"] . "', '" . $_POST["UserB"] . "')";
                $conn->query($sql);
            } else if($_POST["PairStatus"] == "Confirm") {
                $sql = "SELECT set_pair('" . $_POST["LobbyID"] . "', '" . $_POST["PairName"] . "')";
                $conn->query($sql);
            } else if(!empty($_POST["UserB"]) && $_POST["PairStatus"] == "Delete") {
                $sql = "SELECT delete_pair('" . $_POST["LobbyID"] . "', '" . $_POST["PairName"] . "')";
                $conn->query($sql);
            } 
        }

        // RECEIVE
        $sql = "SELECT GameState, Timer FROM lobbies WHERE LobbyID='" . $_POST["LobbyID"] . "'";
        $result = $conn->query($sql)->fetch_assoc();
        echo($result["GameState"] . ";" . $result["Timer"] . "`");

        $sql = "SELECT UserName, Host, UserStatus, Score FROM users WHERE LobbyID='" . $_POST["LobbyID"] . "'";
        $query = $conn->query($sql);
        while ($result = $query->fetch_assoc()) {
            echo("U;" . $result["Username"] . ";" . $result["Host"] . ";" . $result["UserStatus"] . ";" . $result["Score"] . "`");
        }

        $sql = "SELECT PairName, UserA, UserB, UserC FROM users WHERE LobbyID='" . $_POST["LobbyID"] . "'";
        $query = $conn->query($sql);
        while ($result = $query->fetch_assoc()) {
            echo("P;" . $result["PairName"] . ";" . $result["UserA"] . ";" . $result["UserB"] . ";" . $result["UserC"] . "`");
        }

        if ($_POST["RequestCat"]) {
            $sql = "SELECT CatName FROM categories WHERE LobbyID='" . $_POST["LobbyID"] . "'";
            $query = $conn->query($sql);
            while ($result = $query->fetch_assoc()) {
                echo("C;" . $result["CatName"] . "`");
            }
        }

        if ($_POST["RequestItem"]) {
            $sql = "SELECT Item FROM names WHERE LobbyID='" . $_POST["LobbyID"] . "' AND Used=FALSE ORDER BY RAND() LIMIT 1";
            $item = $conn->query($sql)->fetch_assoc()["Item"];
            $sql = "UPDATE names SET Used=TRUE WHERE Item='" . $item . "' AND LobbyID='" . $_POST["LobbyID"] . "'";
            $conn->query($sql);
            echo("I;" . $item . "`");
        }

        $sql = "SELECT UserName, Content, TimeSent FROM messages WHERE MessageID>" . $_POST["LastMID"] . " AND LobbyID='" . $_POST["LobbyID"] . "'";
        $query = $conn->query($sql);
        while ($result = $query->fetch_assoc()) {
            echo("M;" . $result["UserName"] . ";" . $result["TimeSent"] . ";" . $result["Content"] . "`");
        }

        $conn->query("UNLOCK TABLES");
    } 
?>