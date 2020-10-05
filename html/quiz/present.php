<?php
  if ($_COOKIE["Language"] == "FR") {
    $slides   = "Diapositives";
    $control  = "Contrôle";
    $comments = "Commentaires";
  } else {
    $slides   = "Slides";
    $control  = "Control";
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
      sendCommand('UP_SLIDES', null, updateSlidesNoEdit);
    </script>
  </head>
  <body onresize="displaySlide(); updateLabels()">
    <div id="Presentator">
      <div id="Slides">
        <div class="title"><?php echo($slides); ?></div>
        <div id="SlidesContainer"></div>
      </div>
      <div id="SlideViewer">
        <div id="SlideContainer">
          <div id="Slide"></div>
        </div>
        <div id="SlideComments">
          <div><?php echo($comments); ?>:</div>
          <textarea id="SlideCommentText" readonly="true"></textarea>
        </div>
      </div>
      <div id="Controls">
        <div class="title"><?php echo($control); ?></div>
        <input id="Prev" type="button" value="<" onclick="selectPrev()"/>
        <input id="Next" type="button" value=">" onclick="selectNext()"/>
      </div>
    </div>
  </body>
</html>