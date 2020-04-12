<?php
  $lang = NULL;

  if (!empty($_GET["lang"])) {
    $lang = $_GET["lang"];
    setcookie("Language", $lang, time() + 86400 * 30, "/");
  } else if (empty($_COOKIE["Language"])) {
    setcookie("Language", "EN", time() + 86400 * 30, "/");
    $lang = "EN";
  } else {
    $lang = $_COOKIE["Language"];
  }

  if ($lang == "FR") {
    $title  = "Qui suis-je?";
    $create = "Nouvelle partie";
    $join   = "Rejoindre une partie en cours";
    $ol     = "EN";
  } else {
    $title  = "Who am I?";
    $create = "New game";
    $join   = "Join an ongoing game";
    $ol     = "FR";
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
      <input id="Create" type="button" value="<?php echo($create); ?>" onclick="window.location='create.php'"/>
      <input id="Join"   type="button" value="<?php echo($join); ?>" onclick="window.location='join.php'"/>
    </div>
    <div id="Help" onclick="window.location='help.php'">?</div>
    <div id="Back" onclick="window.location='/'"><</div>
    <div id="Lang" onclick="window.location='.?lang=<?php echo($ol); ?>'"><?php echo($ol); ?></div>
  </body>
</html>