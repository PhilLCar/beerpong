<?php
  if ($_COOKIE["Language"] == "FR") {
    $title  = "Rejoindre une partie";
    $info   = "Quel est votre <b>vrai</b> nom?";
    $game   = "Identifiant de la partie (4 lettres):";
  } else {
    $title  = "Join game";
    $info   = "What's you <b>real</b> name?";
    $game   = "Game identifier (4 letters):";
  }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title><?php echo($title); ?></title>
    <link rel="stylesheet" type="text/css" href="/css/whoami.css"/> 
  </head>
  <body>
    <div id="MainMenu">
      <h1 id="MainMenuTitle"><?php echo($title); ?></h1>
        <form id="NewGame" method="POST" action="game.php">
            <?php echo($info); ?><br>
            <input name="UserName" type="text"/><br><br>
            <?php echo($game); ?><br>
            <input name="GameID" type="text" /><br><br>
            <input id="Join" type="submit" value="GO!"/>
        </form>
    </div>
  </body>
</html>