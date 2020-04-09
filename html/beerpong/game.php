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
  $database   = "beerpong";

  $conn = mysqli_connect($servername, $username, $password, $database);
  $update = array();
  $error = 0;
  
	if (empty($_COOKIE["GameID"]) || empty($_COOKIE["TeamName"]) || empty($_COOKIE["UserName"])) {
	  if (empty($_POST["GameID"])) {
      header("Location: join.php?error=1");
      $conn->close();
      exit();
	  }
	  if (empty($_POST["TeamName"])) {
	    $error |= 2;
	  }
	  if (empty($_POST["MemberA"])) {
		  $error |= 4;
	  }
	  if ($_POST["MemberA"] == $_POST["MemberB"]) {
		  $error |= 64;
    }
    
    $memberA = rmchars($_POST["MemberA"], ";");
    $memberB = rmchars($_POST["MemberB"], ";");
    $teamName = rmchars($_POST["TeamName"], ";");

    $_POST["MemberA"] = escape(rmchars($_POST["MemberA"], ";"));
    $_POST["MemberB"] = escape(rmchars($_POST["MemberB"], ";"));
    $_POST["TeamName"] = escape(rmchars($_POST["TeamName"], ";"));

    if (empty($_COOKIE["GameID"])) {
      setcookie("GameID", $_POST["GameID"], time() + 86400, "/beerpong");
      $_COOKIE["GameID"] = $_POST["GameID"];
    }

    if ($conn && !$error) {
      $conn->query("LOCK TABLES users WRITE, teams WRITE, games WRITE");

      // User 1
      $sql = "SELECT * FROM users WHERE UserName='" . $_POST["MemberA"] . "'";
      if (!$conn->query($sql)->num_rows) {
        $update[] = "INSERT INTO users(UserName, LastUpdate, Wins, Loses) VALUES ('" . $_POST["MemberA"] . "', NOW(), 0, 0)";
      } else {
        $sql = "SELECT user_active('" . $_POST["MemberA"] . "') AS active";
        $result = $conn->query($sql)->fetch_assoc();
        if ($result["active"]) {
          header("Location: team.php?error=32");
				  $conn->query("UNLOCK TABLES");
          $conn->close();
          exit();
        } else {
          $update[] = "UPDATE users SET LastUpdate=NOW() WHERE UserName='" . $_POST["MemberA"] . "'";
        }
      }

      // User 2
      if (!empty($_POST["MemberB"])) {
        $sql = "SELECT * FROM users WHERE UserName='" . $_POST["MemberB"] . "'";
        if (!$conn->query($sql)->num_rows) {
          $update[] = "INSERT INTO users(UserName, LastUpdate, Wins, Loses) VALUES ('" . $_POST["MemberB"] . "', NOW(), 0, 0)";
        } else {
          $sql = "SELECT user_active('" . $_POST["MemberA"] . "') AS active";
          $result = $conn->query($sql)->fetch_assoc();
          if ($result["active"]) {
            header("Location: team.php?error=64");
            $conn->query("UNLOCK TABLES");
            $conn->close();
            exit();
          } else {
            $update[] = "UPDATE users SET LastUpdate=NOW() WHERE UserName='" . $_POST["MemberB"] . "'";
          }
        }
      }

      // Team
      $newteam = true;
      $sql = "SELECT * FROM teams WHERE TeamName='" . $_POST["TeamName"] . "'";
      $result = $conn->query($sql);
      if (!$conn->query($sql)->num_rows) {
        $update[] = "INSERT INTO teams(TeamName, Color, MemberA, MemberB, Wins, Loses) VALUES ('" . 
                    $_POST["TeamName"] . "', 'white', '" .
                    $_POST["MemberA"]  . "', " .
                    (empty($_POST["MemberB"]) ? "NULL" : "'" . $_POST["MemberB"] . "'") .
                    ", 0, 0)";
      } else {
        $sql = "SELECT * FROM games WHERE Active=TRUE AND " .
          "(TeamA='" . $_POST["TeamName"] . "' OR " .
           "TeamB='" . $_POST["TeamName"] . "')";
        if ($conn->query($sql)->num_rows) {
          $sql = "SELECT * FROM teams WHERE TeamName='" . $_POST["TeamName"] . "' AND NOT MemberB=NULL";
          if ($conn->query($sql)->num_rows || !empty($_POST["MemberB"])) {
            header("Location: join.php?error=32");
            $conn->query("UNLOCK TABLES");
            $conn->close();
            exit();
          } else {
            $newteam = false;
            $update[] = "UPDATE teams SET MemberB='" . $_POST["MemberA"] . "' WHERE TeamName='" . $_POST["TeamName"] . "'";
          }
        } else {
          // team exists but not active
          $update[] = "UPDATE teams SET MemberA='" . $_POST["MemberA"] . "', " . (empty($_POST["MemberB"]) ? "" : "MemberB='" . $_POST["MemberB"] . "', ") .
                        "Color='white' WHERE TeamName='" . $_POST["TeamName"] . "'";
        }
      }

      if ($newteam) {
        $update[] = "UPDATE games SET TeamB='" . $_POST["TeamName"] . "' WHERE GameID=" . $_POST["GameID"];
      }
 
      foreach ($update as $sql) {
        if (!$conn->query($sql)) {
          header("Location: join.php?error=128");
          $conn->query("UNLOCK TABLES");
          $conn->close();
          exit();
        }
      }

      setcookie("UserName", $memberA, time() + 86400, "/beerpong");
      $_COOKIE["UserName"] = $memberA;
      setcookie("TeamName", $teamName, time() + 86400, "/beerpong");
      $_COOKIE["TeamName"] = $teamName;
      if (!empty($_POST["MemberB"])) {
        setcookie("PartnerName", $memberB, time() + 86400, "/beerpong");
        $_COOKIE["PartnerName"] = $memberB;
      }

    } else {
      if (!$conn) $error |= 8;
    }
  }

  if ($conn) {
    $sql = "SELECT * FROM games WHERE GameID=" . $_COOKIE["GameID"];
    $result = $conn->query($sql);
    $game = $result->fetch_assoc();

    $conn->query("UNLOCK TABLES");
    $conn->close();

    if (!$game["Active"]) {
      header("Location: index.php");
      exit();
    }
  }

  if ($error) {
    header("Location: team.php?error=" . $error);
  }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <title>BEERPONG</title>
    <script type="text/javascript" src="/js/beerpong.js"></script>
    <link rel="stylesheet" type="text/css" href="/css/beerpong.css"/>
    <script>
      window.setInterval(refresh, 1000);
    </script>
  </head>
  <body onload="resizetable()">
    <div id="Title">
      <div id="Home">
        <?php
          echo($_COOKIE["TeamName"]);
        ?>
      </div>
      VS
      <div id="Away">
        <?php
          if ($_COOKIE["TeamName"] == $game["TeamA"]) 
            if (empty($game["TeamB"])) echo("...");
            else echo($game["TeamB"]);
          else   echo($game["TeamA"]);
        ?>
      </div>
    </div>
    <div id="Redemption" hidden="true">REDEMPTION<br>
      <input id="RedYes" type="button" hidden="true" value="I GOT IT!" onclick="update('Redemption')"/>
      <input id="RedNo" type="button" hidden="true" value="I MISSED :(" onclick="update('End')"/>
    </div>
    <div id="Turn" hidden="true">YOUR TURN!<br>
      <input id="Done" type="button" value="DONE" onclick="update('Turn')"/>
    </div>
    <div id="Rerack" onclick="openreracks()">
      R E R A C K
    </div>
    <div id="RerackMenu" hidden="true" onclick="openreracks()">
      <div class="RerackMenuItem" onclick="rerack(1)" onmouseover="triangleP()" onmouseleave="document.getElementById('Preview').innerHTML=''">TRIANGLE</div>
      <div class="RerackMenuItem" onclick="rerack(2)" onmouseover="rtriangleP()" onmouseleave="document.getElementById('Preview').innerHTML=''">REVERSE TRIANGLE</div>
      <div class="RerackMenuItem" onclick="rerack(3)" onmouseover="flagP()" onmouseleave="document.getElementById('Preview').innerHTML=''">FLAG</div>
      <div class="RerackMenuItem" onclick="rerack(4)" onmouseover="rflagP()" onmouseleave="document.getElementById('Preview').innerHTML=''">REVERSE FLAG</div>
      <div class="RerackMenuItem" onclick="rerack(5)" onmouseover="lineP()" onmouseleave="document.getElementById('Preview').innerHTML=''">INLINE</div>
      <div class="RerackMenuItem" onclick="rerack(6)" onmouseover="line4P()" onmouseleave="document.getElementById('Preview').innerHTML=''">INLINE 4</div>
      <div class="RerackMenuItem" onclick="rerack(7)" onmouseover="hlineP()" onmouseleave="document.getElementById('Preview').innerHTML=''">HORIZONTAL LINE</div>
      <div class="RerackMenuItem" onclick="rerack(8)" onmouseover="hline4P()" onmouseleave="document.getElementById('Preview').innerHTML=''">HORIZONTAL LINE 4</div>
      <div class="RerackMenuItem" onclick="rerack(9)" onmouseover="diamondP()" onmouseleave="document.getElementById('Preview').innerHTML=''">DIAMOND</div>
      <div class="RerackMenuItem" onclick="rerack(10)" onmouseover="hdiamondP()" onmouseleave="document.getElementById('Preview').innerHTML=''">HORIZONTAL DIAMOND</div>
      <div class="RerackMenuItem" onclick="rerack(11)" onmouseover="penisP()" onmouseleave="document.getElementById('Preview').innerHTML=''">PENIS</div>
      <div class="RerackMenuItem" onclick="rerack(12)" onmouseover="rpenisP()" onmouseleave="document.getElementById('Preview').innerHTML=''">REVERSE PENIS</div>
    </div>
    <div id="Quit" onclick="window.location='index.php'">
      Q U I T
    </div>
    <div id="Table">
      <style id="TableStyle" type="text/css">
      </style>
      <style id="GlassesStyle" type="text/css">
      </style>
      <div id="Preview" rack="0"></div>
      <div id="Opponent" rack="0">
        <div class="G O" id="O5" onclick="enter(true, 5)"></div>
        <div class="G O" id="O4" onclick="enter(true, 4)"></div>
        <div class="G O" id="O3" onclick="enter(true, 3)"></div>
        <div class="G O" id="O2" onclick="enter(true, 2)"></div>
        <div class="G O" id="O1" onclick="enter(true, 1)"></div>
        <div class="G O" id="O0" onclick="enter(true, 6)"></div>
      </div>
      <div id="Contestant" rack="0">
        <div class="G C" id="C0" onclick="enter(false, 6)"></div>
        <div class="G C" id="C1" onclick="enter(false, 1)"></div>
        <div class="G C" id="C2" onclick="enter(false, 2)"></div>
        <div class="G C" id="C3" onclick="enter(false, 3)"></div>
        <div class="G C" id="C4" onclick="enter(false, 4)"></div>
        <div class="G C" id="C5" onclick="enter(false, 5)"></div>
      </div>
    </div>
  </body>
</html>
