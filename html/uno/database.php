<?php
  function printGameInfo($conn) {
    $sql = "SELECT * FROM games WHERE GameID='" . $_POST["GameID"] . "'";
    $result = $conn->query($sql)->fetch_assoc();
    echo($result["GameState"] . ";" . $result["Turn"] . ";" . $result["RequestUpdate"]);
    $sql = "SELECT * FROM deck WHERE GameID='" . $_POST["GameID"] . "'";
    $result = $conn->query($sql);
    if ($result->num_rows) echo(";C");
    while ($row = $result->fetch_assoc()) {
      echo(";" . $row["CardID"] . ";" . $row["OwnerID"] . ";" . $row["DeckPosition"]);
    }
    echo(";U");
    $sql = "SELECT * FROM users WHERE GameID='" . $_POST["GameID"] . "'";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) {
      echo(";" . $row["UserID"] . ";" . $row["UserName"] . ";" . $row["HideCards"]);
    }
  }

  // DATABASE CONNECTION
	$servername = "localhost";
	$username   = "webserver";
	$password   = "BP4Life";
	$database   = "uno";

  $conn = mysqli_connect($servername, $username, $password, $database);
  if ($conn) {
    switch ($_POST["Command"]) {
      case "GET_USER_ID":
        $conn->query("LOCK TABLES users, games WRITE");
        $sql = "INSERT INTO users (GameID, UserName) VALUES ('" . rawurlencode($_POST["GameID"]) . "', '" . rawurlencode($_POST["UserName"]) . "')";
        if ($conn->query($sql)) {
          $result = $conn->query("SELECT LAST_INSERT_ID() AS UserID");
          echo($result->fetch_assoc()["UserID"]);
          $conn->query("UPDATE games SET RequestUpdate=RequestUpdate+1 WHERE GameID='" . $_POST["GameID"] . "'");
        } else echo("-1");
        $conn->query("UNLOCK TABLES");
        break;
      case "UPDATE":
        $i = 0;
        if (empty($_POST["Immediate"])) {
          for (; $i < 120; $i++) {
            usleep(500000);
            $result = $conn->query("SELECT RequestUpdate FROM games WHERE GameID='" . $_POST["GameID"] . "'")->fetch_assoc();
            if ($result["RequestUpdate"] != $_POST["RequestUpdate"]) break;
          }
        }
        if ($i < 120 || !empty($_POST["Immediate"])) printGameInfo($conn);
        break;
      default:
        break;
    }
    $conn->close();
  }
?>