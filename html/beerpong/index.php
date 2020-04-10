<?php
  function escape($string) {
    $final = "";
    foreach (str_split($string) as $charA) {
        if ($charA == "'") $final .= "\\";
        if ($charA == "\\") $final .= "\\";
        $final .= $charA;
    }
    return $final;
  }

  if (!empty($_COOKIE["UserName"]) || !empty($_COOKIE["PartnerName"])) {
    // DATABASE CONNECTION
    $servername = "localhost";
    $username   = "webserver";
    $password   = "BP4Life";
    $database   = "beerpong";

    $conn = mysqli_connect($servername, $username, $password, $database);

    if ($conn) {
      $sql = "UPDATE users SET LastUpdate=DATE_SUB(NOW(), INTERVAL 300 SECOND) WHERE UserName='" . escape($_COOKIE["UserName"]) . "'" .
              (empty($_COOKIE["PartnerName"]) ? "" : " OR UserName='" . escape($_COOKIE["PartnerName"]) . "'");
      $conn->query($sql);

      $sql = "SELECT game_active(" . $_COOKIE["GameID"] . ")";
      $conn->query($sql);
      
      $conn->close();
    }
  }
  setcookie("GameID", "", time() - 86400, "/beerpong");
  setcookie("TeamName", "", time() - 86400, "/beerpong");
  setcookie("UserName", "", time() - 86400, "/beerpong");
  setcookie("PartnerName", "", time() - 86400, "/beerpong");
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <link rel="stylesheet" type="text/css" href="/css/beerpong.css"/> 
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>BEERPONG TOURNAMENT</title>
  </head>
  <body>
    <div>
      <h1>BEERPONG<br>TOURNAMENT</h1>
      <div id="MainButtons">
        <input type="button" id="CreateButton" value="CREATE" onclick="location.href='create.php'"/>
        <input type="button" id="JoinButton" value="JOIN" onclick="location.href='join.php'"/>
      </div>
    </div>
    <div id="Help" onclick="window.location='help.php'">?</div>
    <div id="Back" onclick="window.location='/'"><</div>
  </body>
</html>

