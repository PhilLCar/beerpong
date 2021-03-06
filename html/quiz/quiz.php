<?php
  // DATABASE CONNECTION
	$servername = "localhost";
	$username   = "webserver";
	$password   = "BP4Life";
	$database   = "quiz";

  $conn = mysqli_connect($servername, $username, $password, $database);
  if ($conn) {
    $query = $conn->query("SELECT * FROM presentations WHERE PresentationID=" . $_POST["PresentationID"]);
    $conn->close();
  }
  if ($query->num_rows) {
    $presentation = $query->fetch_assoc();
  } else {
    header("Location: presentations.php");
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
      _PASSHASH = "NO_EDIT";
      sendCommand('UP_CUR_SLIDE', { Immediate: true }, continuousUpdate);
    </script>
  </head>
  <body onresize="displaySlide(); updateLabels()" onload="displaySlide(); updateLabels()">
    <div id="Presentator">
      <div id="SlideViewer">
        <div id="SlideContainer" edit="false">
          <div id="Slide"></div>
        </div>
      </div>
    </div>
  </body>
</html>