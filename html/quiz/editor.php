<?php
  if ($_COOKIE["Language"] == "FR") {
    $slides   = "Diapositives";
    $tools    = "Outils";
    $labels   = "Texte";
    $images   = "Images";
    $samples  = "Extraits";
    $new      = "Nouveau";
    $news     = "Nouvelle diapo";
    $dels     = "Supprimer diapo";
    $comments = "Commentaires";
  } else {
    $slides   = "Slides";
    $tools    = "Tools";
    $labels   = "Labels";
    $images   = "Images";
    $samples  = "Samples";
    $new      = "New";
    $news     = "New slide";
    $dels     = "Delete slide";
    $comments = "Comments";
  }

  // DATABASE CONNECTION
	$servername = "localhost";
	$username   = "webserver";
	$password   = "BP4Life";
	$database   = "quiz";

  $conn = mysqli_connect($servername, $username, $password, $database);
  if ($conn) {
    $query = $conn->query("SELECT * FROM presentations WHERE PresentationID=" . $_POST["PresentationID"] . " AND PassHash='" . md5($_POST["Password"]) . "'");
    $conn->close();
  }
  if ($query->num_rows) {
    $presentation = $query->fetch_assoc();
  } else {
    header("Location: presentations.php?error=1");
    exit();
  }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title><?php echo(rawurldecode($presentation["Title"])); ?></title>
    <link rel="stylesheet" type="text/css" href="/css/quiz.css"/> 
    <script type="text/javascript" src="/js/quiz.js"></script>
    <script>
      _PRESID   = <?php echo($presentation["PresentationID"]); ?>;
      _PASSHASH = "<?php echo($presentation["PassHash"]); ?>";
      sendCommand('UP_SLIDES', null, updateSlides);
    </script>
  </head>
  <body onresize="displaySlide()">
    <div id="Editor">
      <div id="Slides">
        <div class="title"><?php echo($slides); ?></div>
        <div id="SlidesContainer"></div>
      </div>
      <div id="SlideViewer">
        <div id="SlideContainer">
          <div id="Slide" hidden="true"></div>
        </div>
        <div id="SlideComments" hidden="true">
          <div><?php echo($comments); ?>:</div>
          <textarea id="SlideCommentText" onfocusout="sendCommand('COMMENT', { SlidePosition: _SLIDE_NUM, Comment : encodeURIComponent(document.getElementById('SlideCommentText').value) }, doNothing)"></textarea>
        </div>
      </div>
      <div id="Tools">
        <div class="title"><?php echo($tools); ?></div>
        <div class="newbutton" onclick="sendCommand('NEW_SLIDE', null, updateSlides)">
          <div class="plus">+</div>
          <div><?php echo($news); ?></div>
        </div>
        <div id="DelButton" class="newbutton" onclick="sendCommand('DEL_SLIDE', { SlidePosition: _SLIDE_NUM }, updateSlides);selectSlide(-1)" hidden="true">
          <div class="plus">-</div>
          <div><?php echo($dels); ?></div>
        </div>
        <div id="LabelTools" hidden="true">
          <div class="title"><?php echo($labels); ?></div>
          <div class="newbutton">
            <div class="plus">+</div>
            <div><?php echo($new); ?></div>
          </div>
        </div>
        <div id="ImageTools" hidden="true">
          <div class="title"><?php echo($images); ?></div>
          <div class="newbutton">
            <div class="plus">+</div>
            <div><?php echo($new); ?></div>
          </div>
        </div>
        <div id="SampleTools" hidden="true">
          <div class="title"><?php echo($samples); ?></div>
          <div class="newbutton">
            <div class="plus">+</div>
            <div><?php echo($new); ?></div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>