<?php
    function random_color() {
        $color = rand(0, 5);
        switch ($color) {
            case 0:
                return 'red';
            case 1:
                return 'magenta';
            case 2:
                return 'blue';
            case 3:
                return 'cyan';
            case 4:
                return 'lime';
            case 5:
                return 'yellow';
        }
    }

    // DATABASE CONNECTION
	$servername = "localhost";
	$username   = "webserver";
	$password   = "BP4Life";
	$database   = "beerpong";

	$conn = mysqli_connect($servername, $username, $password, $database);

	if ($conn) {
		$conn->query("LOCK TABLES users WRITE, teams WRITE, games WRITE");

        // user 1
        $sql = "SELECT game_active(" . $_COOKIE["GameID"] . ") AS active";
        $result = $conn->query($sql)->fetch_assoc()["active"];
        if ($result) {
            $sql = "SELECT * FROM games WHERE GameID=" . $_COOKIE["GameID"];
            $result = $conn->query($sql);
            $row = $result->fetch_assoc();

            if (empty($_POST["Push"])) {
                // read
                $sql = "UPDATE users SET LastUpdate=NOW() WHERE UserName='" . $_COOKIE["UserName"] . "'" .
                        (empty($_COOKIE["PartnerName"]) ? "" : " OR UserName='" . $_COOKIE["PartnerName"] . "'");
                $conn->query($sql);

                $sql = "SELECT * FROM teams WHERE TeamName='" . $row["TeamA"] . "'";
                $ColorA = $conn->query($sql)->fetch_assoc()["Color"];
                $ColorB = NULL;
                if ($row["TeamB"] !== NULL) {
                    $sql = "SELECT * FROM teams WHERE TeamName='" . $row["TeamB"] . "'";
                    $ColorB = $conn->query($sql)->fetch_assoc()["Color"];
                }
                if ($ColorA == 'white') {
                    while ($ColorA == $ColorB || $ColorA == 'white') $ColorA = random_color();
                    $sql = "UPDATE teams SET Color='" . $ColorA . "' WHERE TeamName='" . $row["TeamA"] . "'";
                    $conn->query($sql);
                }
                if ($ColorB == 'white') {
                    while ($ColorA == $ColorB || $ColorB == 'white') $ColorB = random_color();
                    $sql = "UPDATE teams SET Color='" . $ColorB . "' WHERE TeamName='" . $row["TeamB"] . "'";
                    $conn->query($sql);
                }

                if ($_COOKIE["TeamName"] == $row["TeamA"]) echo($row["GlassesA"] . ";" . $row["GlassesB"] . ";" . $row["TeamA"] . ";" . $row["TeamB"] .
                                                                ";" . $ColorA . ";" . $ColorB) . ";" . $row["RackA"] . ";" . $row["RackB"] . ";" . 
                                                                $row["Redemption"] . ";" . !$row["Turn"];
                else                                       echo($row["GlassesB"] . ";" . $row["GlassesA"] . ";" . $row["TeamB"] . ";" . $row["TeamA"] .
                                                                ";" . $ColorB . ";" . $ColorA) . ";" . $row["RackB"] . ";" . $row["RackA"] . ";" . 
                                                                $row["Redemption"] . ";" . $row["Turn"];
            } else {
                // write
                if ($_COOKIE["TeamName"] == $row["TeamA"]) {
                    if (!$row["Turn"]) $sql = "UPDATE games SET GlassesB=" . $_POST["Glasses"] . ($_POST["Glasses"] != 0 ? "" : ", Redemption=1") . 
                                                " WHERE GameID=" . $_COOKIE["GameID"];
                } else {
                    if ($row["Turn"]) $sql = "UPDATE games SET GlassesA=" . $_POST["Glasses"] . ($_POST["Glasses"] != 0 ? "" : ", Redemption=1") . 
                                                " WHERE GameID=" . $_COOKIE["GameID"];
                }
                $conn->query($sql);
                
                if (!empty($_POST["Rack"])) {
                    if ($_POST["Rack"] == "Redemption") {
                        $sql = "UPDATE games SET GlassesA=63, GlassesB=63, RackA=1, RackB=1, Redemption=0 WHERE GameID=" . $_COOKIE["GameID"];
                    } else if ($_POST["Rack"] == "Turn") {
                        $sql = "UPDATE games SET Turn=NOT Turn WHERE GameID=" . $_COOKIE["GameID"];
                    } else if ($_POST["Rack"] == "End") {
                        $sql = "CALL end_game(" . $_COOKIE["GameID"] . ", '" . $_COOKIE["TeamName"] . "')";          
                    } else {
                        if ($_COOKIE["TeamName"] == $row["TeamA"] && !$row["RackB"]) {
                            if (!$row["Turn"]) $sql = "UPDATE games SET GlassesB=63, RackB=" . $_POST["Rack"] . " WHERE GameID=" . $_COOKIE["GameID"];
                        } else if ($_COOKIE["TeamName"] == $row["TeamB"] && !$row["RackA"]) {
                            if ($row["Turn"]) $sql = "UPDATE games SET GlassesA=63, RackA=" . $_POST["Rack"] . " WHERE GameID=" . $_COOKIE["GameID"];
                        }
                    }
                }
                $conn->query($sql);
            }
        }   

        $conn->query("UNLOCK TABLES");
        $conn->close();
    }
?>