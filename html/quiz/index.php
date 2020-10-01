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

  if (!empty($_COOKIE["ID"])) {
    setcookie("ID", "", time() - 86400, "/quiz");
  }
  if (!empty($_COOKIE["UserName"])) {
    setcookie("UserName", "", time() - 86400, "/quiz");
  }

  if ($lang == "FR") {
    $create  = "Créer un nouveau QUIZ!";
    $join    = "Voir la liste de QUIZ!";
    $ol      = "EN";
  } else {
    $create  = "Create a new QUIZ!";
    $join    = "Go to QUIZ list!";
    $ol      = "FR";
  }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>QUIZ</title>
    <link rel="stylesheet" type="text/css" href="/css/quiz.css"/> 
  </head>
  <body>
    <div id="MainMenuContainer">
        <div id="MainMenu">
        <h1 id="MainMenuTitle">QUIZ</h1>
        <input id="Create" type="button" value="<?php echo($create); ?>"  onclick="window.location='create.php'"/>
        <input id="Join"   type="button" value="<?php echo($join); ?>"    onclick="window.location='presentations.php'"/>
        </div>
        <div id="Help" onclick="window.location='help.php'">?</div>
        <div id="Back" onclick="window.location='/'"><</div>
        <div id="Lang" onclick="window.location='.?lang=<?php echo($ol); ?>'"><?php echo($ol); ?></div>
    </div>
  </body>
</html>