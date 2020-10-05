<?php
  if ($_COOKIE["Language"] == "FR") {
    $slides   = "Diapositives";
    $tools    = "Outils";
    $labels   = "Texte";
    $images   = "Images";
    $samples  = "Extraits";
    $new      = "Créer";
    $del      = "Supprimer";
    $news     = "Créer diapo";
    $dels     = "Supprimer diapo";
    $comments = "Commentaires";
    $colors   = "Couleurs";
    $fontsize = "Taille";
    $retry    = "Réessayer";
    $cancel   = "Annuler";
    $start    = "Début";
    $end      = "Fin";
  } else {
    $slides   = "Slides";
    $tools    = "Tools";
    $labels   = "Labels";
    $images   = "Images";
    $samples  = "Samples";
    $new      = "New";
    $del      = "Delete";
    $news     = "New slide";
    $dels     = "Delete slide";
    $comments = "Comments";
    $colors   = "Colours";
    $fontsize = "Size";
    $retry    = "Retry";
    $cancel   = "Cancel";
    $start    = "Start";
    $end      = "End";
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
  <body onresize="displaySlide(); updateLabels()">
    <div id="Editor">
      <div id="Slides">
        <div class="title"><?php echo($slides); ?></div>
        <div id="SlidesContainer"></div>
      </div>
      <div id="SlideViewer">
        <div id="SlideContainer">
          <div id="Slide" hidden="true" onclick="deselect()"></div>
        </div>
        <div id="SlideComments" hidden="true">
          <div><?php echo($comments); ?>:</div>
          <textarea id="SlideCommentText" onfocusout="sendCommand('COMMENT', { SlidePosition: _SLIDE_NUM, Comment : encodeURIComponent(document.getElementById('SlideCommentText').value) }, doNothing)"></textarea>
        </div>
      </div>
      <div id="Tools">
        <div class="title"><?php echo($tools); ?></div>
        <div class="newbutton" onclick="sendCommand('NEW_SLIDE', null, updateSlides)">
          <div>+</div>
          <div><?php echo($news); ?></div>
        </div>
        <div id="DelButton" class="delbutton" onclick="deleteSlide()" hidden="true">
          <div>-</div>
          <div><?php echo($dels); ?></div>
        </div>
        <div id="LabelTools" hidden="true">
          <div class="title"><?php echo($labels); ?></div>
          <div class="newbutton" onclick="sendCommand('NEW_LABEL', { SlidePosition: _SLIDE_NUM }, updateSlide)">
            <div>+</div>
            <div><?php echo($new); ?></div>
          </div>
          <div id="DelLabel" class="delbutton" hidden="true" onclick="deleteLabel()">
            <div>-</div>
            <div><?php echo($del); ?></div>
          </div>
          <div id="ColorPalette" hidden="true">
            <div id="ColorTitle"><?php echo($colors); ?>:</div>
            <div id="ColorContainer">
              <div class="color" onclick="sendColor('black')"   style="background-color: black"></div>
              <div class="color" onclick="sendColor('grey')"    style="background-color: grey"></div>
              <div class="color" onclick="sendColor('white')"   style="background-color: white"></div>
              <div class="color" onclick="sendColor('red')"     style="background-color: red"></div>
              <div class="color" onclick="sendColor('green')"   style="background-color: green"></div>
              <div class="color" onclick="sendColor('blue')"    style="background-color: blue"></div>
              <div class="color" onclick="sendColor('yellow')"  style="background-color: yellow"></div>
              <div class="color" onclick="sendColor('cyan')"    style="background-color: cyan"></div>
              <div class="color" onclick="sendColor('magenta')" style="background-color: magenta"></div>
              <div class="color" onclick="sendColor('orange')"  style="background-color: orange"></div>
            </div>
          </div>
          <div id="FontSize" class="numericInput" hidden="true">
            <div><?php echo($fontsize); ?>:</div>
            <input id="FontSizeInput" type="number" onchange="sendFontSize()"/>
          </div>
        </div>
        <div id="ImageTools" hidden="true">
          <div class="title"><?php echo($images); ?></div>
          <div class="newbutton" onclick="newImage()">
            <div>+</div>
            <div><?php echo($new); ?></div>
          </div>
          <div id="DelImage" class="delbutton" hidden="true" onclick="deleteImage()">
            <div>-</div>
            <div><?php echo($del); ?></div>
          </div>
          <form id="ImageForm" action="image.php" method="POST" target="ImagePromptFrame" hidden="true">
            <input id="ImagePID" type="hidden" name="PresentationID"/>
            <input id="ImageSID" type="hidden" name="SlidePosition"/>
          </form>
        </div>
        <div id="SampleTools" hidden="true">
          <div class="title"><?php echo($samples); ?></div>
          <div class="newbutton" onclick="newSample()">
            <div>+</div>
            <div><?php echo($new); ?></div>
          </div>
          <div id="DelSample" class="delbutton" hidden="true" onclick="deleteSample()">
            <div>-</div>
            <div><?php echo($del); ?></div>
          </div>
          <div id="SampleStart" class="numericInput" hidden="true">
            <div><?php echo($start); ?>:</div>
            <input id="SampleStartInput" type="number" onchange="sendSampleStart()"/>
          </div>
          <div id="SampleEnd" class="numericInput" hidden="true">
            <div><?php echo($end); ?>:</div>
            <input id="SampleEndInput" type="number" onchange="sendSampleEnd()"/>
          </div>
          <form id="SampleForm" action="sample.php" method="POST" target="SamplePromptFrame" hidden="true">
            <input id="SamplePID" type="hidden" name="PresentationID"/>
            <input id="SampleSID" type="hidden" name="SlidePosition"/>
          </form>
        </div>
      </div>
    </div>
    <div id="ImagePrompt" hidden="true">
      <iframe name="ImagePromptFrame" src="image.php" onload="checkImage()">
      </iframe>
      <div id="ImageButtons">
        <input id="IRetryButton"  type="button" hidden="true" value="<?php echo($retry); ?>"  onclick="newImage()"/>
        <input id="ICancelButton" type="button"               value="<?php echo($cancel); ?>" onclick="document.getElementById('ImagePrompt').hidden=true"/>
      </div>
    </div>
    <div id="SamplePrompt" hidden="true">
      <iframe name="SamplePromptFrame" src="sample.php" onload="checkSample()">
      </iframe>
      <div id="SampleButtons">
        <input id="SRetryButton"  type="button" hidden="true" value="<?php echo($retry); ?>"  onclick="newSample()"/>
        <input id="SCancelButton" type="button"               value="<?php echo($cancel); ?>" onclick="document.getElementById('SamplePrompt').hidden=true"/>
      </div>
    </div>
  </body>
</html>