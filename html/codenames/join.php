<?php
  $lang = $_COOKIE["Language"];
  if ($lang == "FR") {
    $join    = "Rejoindre une partie";
    $prompt1 = "Entrez votre nom d'utilisateur:";
    $prompt2 = "Entrez le nom de la partie (4 lettres):";
    $start   = "Commencer!";
  } else {
    $join    = "Join a game";
    $prompt1 = "Enter your username:";
    $prompt2 = "Enter the game name (4 letters)";
    $start   = "Start game!";
  }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title><?php echo($join); ?></title>
    <link rel="stylesheet" type="text/css" href="/css/codenames.css"/> 
  </head>
  <body>
    <div id="MainMenuContainer">
        <div id="MainMenu">
            <h1 id="MainMenuTitle"><?php echo($join); ?></h1>
            <form action="game.php" method="POST">
                <?php echo($prompt1); ?><br>
                <input name="UserName" type="text"/><br><br>
                <?php echo($prompt2); ?><br>
                <input name="ID" type="text"><br><br>
                <input type="submit" value="<?php echo($start); ?>"/>
            </form>
        </div>
    </div>
  </body>
</html>