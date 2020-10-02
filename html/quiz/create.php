<?php
  if ($_COOKIE["Language"] == "FR") {
    $pagetitle = "Créer un nouveau QUIZ!";
    $title     = "Titre:";
    $password  = "Mot de passe:";
    $submit    = "Créer!";
    $error1    = "Vous devez choisir un titre pour votre quiz!";
    $error2    = "Vous devez choisir un mot de passe pour votre quiz!";
    $error4    = "Impossible de se connecter à la base de données!";
    $error8    = "Une erreur inconnue est survenue lors de la création du quiz!";
  } else {
    $pagetitle = "Create a new QUIZ!";
    $title     = "Title:";
    $password  = "Password:";
    $submit    = "Create!";
    $error1    = "You need a title for your quiz!";
    $error2    = "You need a password for your quiz!";
    $error4    = "Can't connect to database!";
    $error8    = "Unknown error during quiz creation!";
  }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title><?php echo($pagetitle); ?></title>
    <link rel="stylesheet" type="text/css" href="/css/quiz.css"/> 
  </head>
  <body>
    <div id="NewGame">
      <h1><?php echo($pagetitle); ?></h1>
      <?php 
        if ($_GET["error"] == 1) echo("<div class=\"error\">" . $error1 . "</div>");
        if ($_GET["error"] == 2) echo("<div class=\"error\">" . $error2 . "</div>");
        if ($_GET["error"] == 4) echo("<div class=\"error\">" . $error4 . "</div>");
        if ($_GET["error"] == 8) echo("<div class=\"error\">" . $error8 . "</div>");
      ?>
      <form action="newgame.php" method="POST">
        <p>
          <div class="info"><?php echo($title); ?></div>
          <input name="title" type="text"/>
        </p><p>
          <div class="info"><?php echo($password); ?></div>
          <input name="password" type="text"/>
        </p>
        <input type="submit" value="<?php echo($submit); ?>"/>
      </form>
    </div>
  </body>
</html>