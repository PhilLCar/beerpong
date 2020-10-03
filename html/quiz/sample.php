<?php
  $valid = !empty($_POST["PresentationID"]);
  if ($_COOKIE["Language"] == "FR") {
    $pagetitle = "Nouvel échantillon";
    $file      = "Téléversez votre échantillon ici:";
    $go        = "OK";
    $download  = "Convertissez un vidéo youtube en fichier mp3!";
    $error1    = "Aucun échantillon téléversé!";
    $error2    = "L'échantillon n'est pas du bon format!";
    $error4    = "L'échantillon est trop volumineux!";
    $error8    = "Erreur du serveur!";
  } else {
    $pagetitle = "New Sample";
    $file      = "Upload your sample here:";
    $go        = "OK";
    $download  = "Convert a youtube video to mp3!";
    $error1    = "No sample!";
    $error2    = "Sample format is wrong!";
    $error4    = "Sample is too big!";
    $error8    = "Server error!";
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
    <div id="SampleUpload">
      <h1><?php echo($pagetitle); ?></h1>
      <?php 
        if ($_GET["error"] == 1) echo("<div class=\"error\">" . $error1 . "</div>");
        if ($_GET["error"] == 2) echo("<div class=\"error\">" . $error2 . "</div>");
        if ($_GET["error"] == 4) echo("<div class=\"error\">" . $error4 . "</div>");
        if ($_GET["error"] == 8) echo("<div class=\"error\">" . $error8 . "</div>");
      ?>
      <a id="Mp3Link" href="https://ytmp3.cc/en13/" target="_blank"><?php echo($download); ?></a>
      <form action="uploadsample.php" enctype="multipart/form-data" method="POST" <?php if(!$valid) echo("hidden=\"true\""); ?>>
        <p>
          <div class="info"><?php echo($file); ?></div>
          <input name="File" type="file"/>
        </p>
        <input type="hidden" name="PresentationID" value="<?php echo($_POST["PresentationID"]); ?>"/>
        <input type="hidden" name="SlidePosition" value="<?php echo($_POST["SlidePosition"]); ?>"/>
        <input type="hidden" id="Result" value="<?php echo($_GET["Success"]); ?>"/>
        <input type="submit" value="<?php echo($go); ?>"/>
      </form>
    </div>
  </body>
</html>