<?php
	$error = 0;
	
	if ($_POST["MemberA"] == "") {
	   	$error |= 1;
	}
	if ($_POST["MemberA"] == $_POST["MemberB"]) {
		$error |= 64;
 	}
	if ($_POST["TeamName"] == "") {
	   	$error |= 2;
	}

	if ($error > 0) {
		header("Location: create.php?error=" .  $error);
		exit();
	}
	
	// DATABASE CONNECTION
	$servername = "localhost";
	$username   = "webserver";
	$password   = "BP4Life";
	$database   = "beerpong";

	$conn = mysqli_connect($servername, $username, $password, $database);
	$update = array();

	if ($conn) {
		$conn->query("LOCK TABLES users WRITE, teams WRITE, games WRITE");

		// user 1
		$sql = "SELECT * FROM users WHERE UserName='" . $_POST["MemberA"] . "'";
	   	if (!$conn->query($sql)->num_rows) {
			$update[] = "INSERT INTO users (UserName, LastUpdate, Wins, Loses) VALUES ('" .
						$_POST["MemberA"] . "', NOW(), 0, 0)";
		} else {
			$sql = "SELECT user_active('" . $_POST["MemberA"] . "') AS active";
			$result = $conn->query($sql)->fetch_assoc();
			if ($result["active"]) {
				header("Location: create.php?error=32");
				$conn->query("UNLOCK TABLES");
				$conn->close();
				exit();
			} else {
				$update[] = "UPDATE users SET LastUpdate=NOW() WHERE UserName='" . $_POST["MemberA"] . "'";
			}
		}
	   
		// user 2
		if ($_POST["MemberB"] != "") {
			$sql = "SELECT * FROM users WHERE UserName='" . $_POST["MemberB"] . "'";
		  	if (!$conn->query($sql)->num_rows) {
				$update[] = "INSERT INTO users (UserName, Wins, Loses) VALUES ('" .
							$_POST["MemberB"] . "', 0, 0)";
	      	} else {
				$sql = "SELECT user_active('" . $_POST["MemberB"] . "') AS active";
				$result = $conn->query($sql)->fetch_assoc();
				if ($result["active"]) {
					header("Location: create.php?error=64");
					$conn->query("UNLOCK TABLES");
					$conn->close();
					exit();
				} else {
					$update[] = "UPDATE users SET LastUpdate=NOW() WHERE UserName='" . $_POST["MemberB"] . "'";
				}
			} 
		} 

		// team
		$sql = "SELECT * FROM teams WHERE TeamName = '" . $_POST["TeamName"] . "'";
	   	if (!$conn->query($sql)->num_rows) {
	      	$update[] = "INSERT INTO teams (TeamName, Color, MemberA, MemberB, Wins, Loses) VALUES (" .
						"'" . $_POST["TeamName"] . "', 'white', " .
						"'" . $_POST["MemberA"] . "', " .
						($_POST["MemberB"] == "" ? "NULL" : "'" . $_POST["MemberB"] . "'") . ", 0, 0)";
	   	} else {
			$sql = "SELECT * FROM games WHERE Active=TRUE AND (" .
					"TeamA='" . $_POST["TeamName"] . "' OR " .
					"TeamB='" . $_POST["TeamName"] . "')";
			if ($conn->query($sql)->num_rows) {
				header("Location: create.php?error=16");
				$conn->query("UNLOCK TABLES");
				$conn->close();
				exit();
			}
			$update[] = "UPDATE teams SET MemberA='" . $_POST["MemberA"] . "', Color='white', " .
						"MemberB=" . ($_POST["MemberB"] == "" ? "NULL" : "'" . $_POST["MemberB"] . "'") .
						"WHERE TeamName='" . $_POST["TeamName"] . "'";
	   	}
		foreach ($update as $sql) $conn->query($sql);

		// game
		$sql = "INSERT INTO games (Active, TeamA, TeamB, GlassesA, GlassesB) VALUES (" .
			"TRUE, " .
			"'" . $_POST["TeamName"] . "', " .
			"NULL, 63, 63)";
		if ($conn->query($sql)) {
			setcookie("GameID", $conn->insert_id, time() + 86400, "/");
			setcookie("UserName", $_POST["MemberA"], time() + 86400, "/");
			setcookie("TeamName", $_POST["TeamName"], time() + 86400, "/");
			if (!empty($_POST["MemberB"])) setcookie("PartnerName", $_POST["MemberB"], time() + 86400, "/");
			header("Location: game.php");
		}
		else {
			header("Location: create.php?error=4");
		}
		$conn->query("UNLOCK TABLES");
		$conn->close();
	} else {
	   header("Location: create.php?error=8");
	}
?>