<?php
  function printRecord($conn) {
    $query = $conn->query("SELECT * FROM dice WHERE SessionID='" . $_POST["SessionID"] . "'");
    if ($query->num_rows) {
      $result = $query->fetch_assoc();
      echo($result["SessionID"] . ";" . $result["ThrowID"]);
      echo(";" . $result["D1"]. ";" . $result["D1N"] . ";" . $result["D1S"]);
      echo(";" . $result["D2"]. ";" . $result["D2N"] . ";" . $result["D2S"]);
      echo(";" . $result["D3"]. ";" . $result["D3N"] . ";" . $result["D3S"]);
      echo(";" . $result["D4"]. ";" . $result["D4N"] . ";" . $result["D4S"]);
      echo(";" . $result["D5"]. ";" . $result["D5N"] . ";" . $result["D5S"]);
    }
  }

  // DATABASE CONNECTION
	$servername = "localhost";
	$username   = "webserver";
	$password   = "BP4Life";
	$database   = "dice";

  $conn = mysqli_connect($servername, $username, $password, $database);
  if ($conn) {
    switch ($_POST["Command"]) {
      case "NEW_SESSION":
        $id = "";
        do {
          $alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          $id = "";
          for ($i = 0; $i < 4; $i++) {
              $id .= $alphabet[rand(0, 25)];
          }

          $sql = "INSERT INTO dice (SessionID) VALUES ('" . $id . "')";
        } while (!$conn->query($sql));
        $_POST["SessionID"] = $id;
        printRecord($conn);
        break;
      case "UPDATE":
        $query = $conn->query("SELECT * FROM dice WHERE SessionID='" . $_POST["SessionID"] . "'");
        if ($query->num_rows) {
          $base = $query->fetch_assoc();
          $i = 0;
          if (empty($_POST["Immediate"])) {
            for (; $i < 1200; $i++) {
              usleep(50000);
              $result = $conn->query("SELECT * FROM dice WHERE SessionID='" . $_POST["SessionID"] . "'")->fetch_assoc();
              if ($result["ThrowID"] != $base["ThrowID"] ||
                  $result["D1S"]     != $base["D1S"]     ||
                  $result["D2S"]     != $base["D2S"]     ||
                  $result["D3S"]     != $base["D3S"]     ||
                  $result["D4S"]     != $base["D4S"]     ||
                  $result["D5S"]     != $base["D5S"]) {
                break;
              }
            }
          }
          if ($i < 1200 || !empty($_POST["Immediate"])) printRecord($conn);
        }
        break;
      case "ROLL":
        $conn->query("UPDATE dice SET " . 
                     "ThrowID=ThrowID+1," .
                     "D1="  . $_POST["D1"]  . "," .
                     "D1N=" . $_POST["D1N"] . "," .
                     "D1S=" . $_POST["D1S"] . "," .
                     "D2="  . $_POST["D2"]  . "," .
                     "D2N=" . $_POST["D2N"] . "," .
                     "D2S=" . $_POST["D2S"] . "," .
                     "D3="  . $_POST["D3"]  . "," .
                     "D3N=" . $_POST["D3N"] . "," .
                     "D3S=" . $_POST["D3S"] . "," .
                     "D4="  . $_POST["D4"]  . "," .
                     "D4N=" . $_POST["D4N"] . "," .
                     "D4S=" . $_POST["D4S"] . "," .
                     "D5="  . $_POST["D5"]  . "," .
                     "D5N=" . $_POST["D5N"] . "," .
                     "D5S=" . $_POST["D5S"] .
                     " WHERE SessionID='" . $_POST["SessionID"] ."'");
        break;
      case "DISABLE":
        $conn->query("UPDATE dice SET " . $_POST["Die"] . "=" . $_POST["Value"] . " WHERE SessionID='" . $_POST["SessionID"] ."'");
        break;
      case "":
      default:
        break;
    }
    $conn->close();
  }
?>