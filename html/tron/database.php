<?php
  header('Content-Type: text/event-stream');
  header('Cache-Control: no-cache');

  function printBoard($conn) {
    $sql = "SELECT * FROM tron WHERE GameID='" . $_POST["GameID"] . "'";
    $result = $conn->query($sql)->fetch_assoc();
    for ($i = 0; $i < 32; $i++) {
      echo(gmp_and($result["R" . $i . "_0"], 0xFFFFFFFF) . ";" . gmp_div($result["R" . $i . "_0"], gmp_pow(2, 32)) . ";" . 
           gmp_and($result["R" . $i . "_1"], 0xFFFFFFFF) . ";" . gmp_div($result["R" . $i . "_1"], gmp_pow(2, 32)) . ";");
    }
    echo($result["Ready"]);
  }

  // DATABASE CONNECTION
  $servername = "localhost";
  $username   = "webserver";
  $password   = "BP4Life";
  $database   = "tron";

  $conn = mysqli_connect($servername, $username, $password, $database);
  
  if ($conn) {
    switch ($_POST["Command"]) {
      case "INIT":
        $sql = "SELECT Ready FROM tron WHERE GameID='" . $_POST["GameID"] . "'";
        $result = $conn->query($sql)->fetch_assoc();
        $ready = intval($result["Ready"]);
        $r = $ready;
        //////////////////////////////////////////////////
        // | 0 0 0 0 | 0 0 0 0 |
        //         ^Dir      ^Ready
        //                 ^Playing
        //               ^Dead
        //////////////////////////////////////////////////
        for ($i = 0; $i < 4; $i++) {
          if (($r & 0xFF) == 0) {
            $r = $i;
            $ready |= (1 + ($i << 4)) << ($i * 8);
            break;
          }
          $r >>= 8;
          if ($i == 3) $r = "S";
        }
        switch($r) {
          //////////////////////////////////////////////////
          // | 0 0 0 0 |
          //   ^Head marker
          //     ^Color code
          //////////////////////////////////////////////////
          case 0:
            $sql = "UPDATE tron SET Ready=" . $ready . ", R8_0=" . (9 << 32) . " WHERE GameID='" . $_POST["GameID"] . "'";
            break;
          case 1:
            $sql = "UPDATE tron SET Ready=" . $ready . ", R23_1=" . (10 << 28) . " WHERE GameID='" . $_POST["GameID"] . "'";
            break;
          case 2:
            $sql = "UPDATE tron SET Ready=" . $ready . ", R8_1=" . (11 << 28) . " WHERE GameID='" . $_POST["GameID"] . "'";
            break;
          case 3:
            $sql = "UPDATE tron SET Ready=" . $ready . ", R23_0=" . (12 << 32) . " WHERE GameID='" . $_POST["GameID"] . "'";
            break;
        }
        if ($r !== "S") $conn->query($sql);
        printBoard($conn);
        echo(";" . $r);
        break;
      case "UPDATE":
        $sql = "SELECT Clock, Ready FROM tron WHERE GameID='" . $_POST["GameID"] . "'";
        $result = $conn->query($sql)->fetch_assoc();
        $clock = $result["Clock"];
        $ready = $result["Ready"];
        $i = 0;
        for (; $i < 50; $i++) {
          usleep(15000);
          $result = $conn->query($sql)->fetch_assoc();
          $nclock = $result["Clock"];
          $nready = $result["Ready"];
          if (($nclock > $clock) || ($ready != $nready)) {
            printBoard($conn);
            if (!$nclock) echo(";-1");
            break;
          }
        }
        if ($i == 50 && $nclock == 0) {
          $sql = "SELECT Ready FROM tron WHERE GameID='" . $_POST["GameID"] . "'";
          $ready = $conn->query($sql)->fetch_assoc()["Ready"];
          echo($ready);
        }
        break;
      case "TURN":
        $shift = $_POST["MyTron"] * 8 + 4;
        $sql   = "UPDATE tron SET Ready=Ready&~(0xF<<" . $shift . ")|(" . $_POST["Dir"] . "<<" . $shift . ")|(1<<" . ($shift - 3) . ")" .
                 " WHERE GameID='" . $_POST["GameID"] . "'";
        $conn->query($sql);
        break;
      case "CLOCK":
        $sql = "UPDATE tron SET Clock=Clock+1 WHERE GameID='" . $_POST["GameID"] . "'";
        $conn->query($sql);
        $sql = "SELECT Ready FROM tron WHERE GameID='" . $_POST["GameID"] . "'";
        $ready = $conn->query($sql)->fetch_assoc()["Ready"];
        for ($i = 0; $i < 4; $i++) {
          if (($ready >> (8 * $i)) & 0x4) {
            echo("1");
            break;
          }
        }
        break;
      case "RESET_HEADS":
        $mask = 0;
        for ($i = 0; $i < 16; $i++) $mask |= 8 << (4 * $i);
        $mask = ~$mask;
        $sql = "UPDATE tron SET ";
        for ($i = 0; $i < 32; $i++) $sql .= "R" . $i . "_0=R" . $i . "_0&" . $mask . ", R" . $i . "_1=R" . $i . "_1&" . $mask . ($i == 31 ? " " : ", ");
        $sql .= "WHERE GameID='" . $_POST["GameID"] . "'";
        $conn->query($sql);
        break;
      case "EAT":
        $val  = ($_POST["ID"] + 9) << (($_POST["X"] % 16) * 4);
        $item = "R" . $_POST["Y"] . "_" . ($_POST["X"] > 15 ? "1" : "0");
        $sql = "UPDATE tron SET " . $item . "=" . $item . "|" . $val . " WHERE GameID='" . $_POST["GameID"] . "'";
        $conn->query($sql);
        break;
      case "DIE":
        $val  = ($_POST["ID"] + 9) << (($_POST["X"] % 16) * 4);
        $item = "R" . $_POST["Y"] . "_" . ($_POST["X"] > 15 ? "1" : "0");
        $sql = "UPDATE tron SET " . $item . "=" . $item . "|" . $val . " WHERE GameID='" . $_POST["GameID"] . "'";
        $conn->query($sql);
        $val = 4 << ($_POST["ID"] * 8);
        $sql = "UPDATE tron SET Ready=Ready|" . $val . " WHERE GameID='" . $_POST["GameID"] . "'";
        $conn->query($sql);
        break;
    }
    $conn->close();
  }
?>