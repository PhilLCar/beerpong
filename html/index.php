<?php
  if (!empty($_COOKIE["UserName"]) || !empty($_COOKIE["PartnerName"])) {
    // DATABASE CONNECTION
    $servername = "localhost";
    $username   = "webserver";
    $password   = "BP4Life";
    $database   = "beerpong";

    $conn = mysqli_connect($servername, $username, $password, $database);

    if ($conn) {
      $sql = "UPDATE users SET LastUpdate=NOW()-300 WHERE UserName='" . $_COOKIE["UserName"] . "'" .
              (empty($_COOKIE["PartnerName"]) ? "" : " OR UserName='" . $_COOKIE["PartnerName"] . "'");
      $conn->query($sql);

      $sql = "SELECT game_active(" . $_COOKIE["GameID"] . ")";
      $conn->query($sql);
      
      $conn->close();
    }
  }
  setcookie("GameID", "", time() - 86400, "/");
  setcookie("TeamName", "", time() - 86400, "/");
  setcookie("UserName", "", time() - 86400, "/");
  setcookie("PartnerName", "", time() - 86400, "/");
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <link rel="stylesheet" type="text/css" href="css/style.css"/> 
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
  </body>
</html>

