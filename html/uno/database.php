<?php
  function printGameInfo($conn) {
    $sql = "SELECT * FROM games WHERE GameID='" . $_POST["GameID"] . "'";
    $result = $conn->query($sql)->fetch_assoc();
    echo($result["GameState"] . ";" . $result["Turn"]);
    $sql = "SELECT * FROM deck WHERE GameID='" . $_POST["GameID"] . "'";
    $result = $conn->query($sql);
    if ($result->num_rows) echo(";C");
    while ($result->fetch_assoc()) {
      echo(";" . $result["CardID"] . ";" . $result["OwnerID"] . ";" . $result["DeckPosition"]);
    }
    echo(";U");
    $sql = "SELECT * FROM users WHERE GameID='" . $_POST["GameID"] . "'";
    $result = $conn->query($sql);
    while ($result->fetch_assoc()) {
      echo(";" . $result["UserID"] . ";" . $result["UserName"] . ";" . $result["HideCards"]);
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
        $conn->query("LOCK TABLES users WRITE");
        $sql = "INSERT INTO users (GameID, UserName) VALUES ('" . rawurlencode($_POST["GameID"]) . "', '" . rawurlencode($_POST["UserName"]) . "')";
        if ($conn->query($sql)) {
          $result = $conn->query("SELECT LAST_INSERT_ID() AS UserID");
          echo($result->fetch_assoc()["UserID"]);
          $conn->query("UPDATE games SET RequestUpdate=RequestUpdate+1");
        } else echo("-1");
        $conn->query("UNLOCK TABLES");
        break;
      case "UPDATE":
        $query = $conn->query("SELECT RequestUpdate FROM games WHERE GameID='" . $_POST["GameID"] . "'");
        if ($query->num_rows) {
          $base = $query->fetch_assoc();
          $i = 0;
          if (empty($_POST["Immediate"])) {
            for (; $i < 120; $i++) {
              usleep(500000);
              $result = $conn->query("SELECT RequestUpdate FROM games WHERE GameID='" . $_POST["GameID"] . "'");
              if ($result["RequestUpdate"] != $base["RequestUpdate"]) break;
            }
          }
          if ($i < 120 || !empty($_POST["Immediate"])) printGameInfo($conn);
        }
        break;
      default:
        break;
    }
    $conn->close();
  }
?>