<?php
  if ($_COOKIE["Language"] == "FR") {
    $title  = "Nouvelle partie";
    $info   = "Quel est votre <b>vrai</b> nom?";
  } else {
    $title  = "New game";
    $info   = "What's you <b>real</b> name?";
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
      <div id="Info"><?php echo($info); ?></div>
        <form id="NewGame" method="POST" action="game.php">
            <input name="UserName" type="text"/>
            <input id="Create" type="submit" value="GO!"/>
        </form>
    </div>
  </body>
</html>