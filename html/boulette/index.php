<?php
  setcookie("LobbyID", "", time() - 86400, "/boulette");
  setcookie("UserName", "", time() - 86400, "/boulette");
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>LA BOULETTE</title>
    <link rel="stylesheet" type="text/css" href="/css/boulette.css"/> 
  </head>
  <body>
    <div id="MainMenu">
      <h1>LA BOULETTE</h1>
      <input id="Create" type="button" value="Nouvelle partie" onclick="window.location='create.php'"/>
      <input id="Join"   type="button" value="Rejoindre" onclick="window.location='join.php'"/>
    </div>
  </body>
</html>