<?php
  $lang = $_COOKIE["Language"];
  if ($lang == "FR") {
    $create = "Nouvelle partie";
    $prompt = "Entrez votre nom d'utilisateur:";
    $start  = "Commencer!";
  } else {
    $create = "New game";
    $prompt = "Enter your username:";
    $start  = "Start game!";
  }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title><?php echo($create); ?></title>
    <link rel="stylesheet" type="text/css" href="/css/codenames.css"/> 
  </head>
  <body>
    <div id="MainMenuContainer">
        <div id="MainMenu">
            <h1 id="MainMenuTitle"><?php echo($create); ?></h1>
            <form action="game.php" method="POST">
                <?php echo($prompt); ?><br>
                <input name="UserName" type="text"/>
                <input type="submit" value="<?php echo($start); ?>"/>
            </form>
        </div>
    </div>
  </body>
</html>