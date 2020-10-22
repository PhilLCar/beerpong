<?php
  function printGameInfo($conn) {
    $sql = "SELECT * FROM games WHERE GameID='" . $_POST["GameID"] . "'";
    $result = $conn->query($sql)->fetch_assoc();
    echo($result["GameState"] . ";" . $result["Turn"] . ";" . $result["RequestUpdate"] . ";" . 
         $result["Clockwise"] . ";" . $result["DeckColor"] . ";" . $result["PickStack"]);
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
      echo(";" . $row["UserID"] . ";" . $row["UserName"] . ";" . $row["HideCards"] . ";" . $row["Uno"] . ";" . $row["Signal"]);
    }
  }

  function updateGameState($conn, $cid) {
    $conn->query("UPDATE games SET DeckColor=" . (floor($cid / 14) % 2) . " WHERE GameID='" . $_POST["GameID"] . "'");
    if (($cid % 14) == 10) {        // skip
      $result = $conn->query("SELECT Clockwise FROM games WHERE GameID='" . $_POST["GameID"] . "'")->fetch_assoc();
      $sql = "";
      if ($result["Clockwise"]) {
        $sql = "UPDATE games SET Turn=Turn+1 WHERE GameID='" . $_POST["GameID"] . "'";
      } else {
        $sql = "UPDATE games SET Turn=Turn-1 WHERE GameID='" . $_POST["GameID"] . "'";
      }
      $conn->query($sql);
    } else if (($cid % 14) == 11) { // reverse
      $conn->query("UPDATE games SET Clockwise=!Clockwise WHERE GameID='" . $_POST["GameID"] . "'");
    } else if (($cid % 14) == 12) { // +2
      $conn->query("UPDATE games SET PickStack=PickStack+2 WHERE GameID='" . $_POST["GameID"] . "'");
    } else if ((($cid % 14) == 13)) {
      if ($cid < 56) {              // multi
        $conn->query("UPDATE games SET DeckColor=NULL WHERE GameID='" . $_POST["GameID"] . "'");
      } else {                      // +4
        $conn->query("UPDATE games SET DeckColor=NULL, PickStack=PickStack+2 WHERE GameID='" . $_POST["GameID"] . "'");
      }
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
      case "INIT":
        $dp = 0;
        for ($i = 0; $i < 112; $i++) {
          if ((($i % 14) == 0) && $i >= 56) continue;
          $sql = "INSERT INTO deck (GameID, CardID) VALUES ('" . $_POST["GameID"] . "', " . $i . ")";
          $conn->query($sql);
        }
        $cards = $conn->query("SELECT * FROM deck  WHERE GameID='" . $_POST["GameID"] . "' ORDER BY RAND()");
        while ($row = $cards->fetch_assoc()) {
          $conn->query("UPDATE deck SET DeckPosition=" . $dp++ . " WHERE CardID=" . $row["CardID"] . " AND GameID='" . $row["GameID"] . "'");
        }
        $cards = $conn->query("SELECT * FROM deck  WHERE GameID='" . $_POST["GameID"] . "' ORDER BY -DeckPosition");
        $users = $conn->query("SELECT * FROM users WHERE GameID='" . $_POST["GameID"] . "'");
        while ($user = $users->fetch_assoc()) {
          for ($i = 0; $i < 7; $i++) {
            $card = $cards->fetch_assoc();
            $conn->query("UPDATE deck SET DeckPosition=NULL, OwnerID=" . $user["UserID"] . " WHERE CardID=" . $card["CardID"] . " AND GameID='" . $card["GameID"] . "'");
          }
        }
        $card = $cards->fetch_assoc();
        $conn->query("UPDATE deck SET DeckPosition=-1 WHERE CardID=" . $card["CardID"] . " AND GameID='" . $card["GameID"] . "'");
        $conn->query("UPDATE games SET GameState=1, RequestUpdate=RequestUpdate+1 WHERE GameID='" . $_POST["GameID"] . "'");
        updateGameState($conn, $card["CardID"]);
        break;
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