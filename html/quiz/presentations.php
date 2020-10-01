<?php
  if ($_COOKIE["Language"] == "FR") {
    $pagetitle  = "Présentations";
    $title      = "Titre";
    $ongoing    = "En cours";
    $lastupdate = "Dernière mise-à-jour";
    $yes        = "Oui";
    $no         = "Non";
    $join       = "Joindre";
    $present    = "Présenter";
    $edit       = "Modifier";
    $error1     = "Mauvais mot de passe!";
  } else {
    $pagetitle  = "Presentations";
    $title      = "Title";
    $ongoing    = "Ongoing";
    $lastupdate = "Last update";
    $yes        = "Yes";
    $no         = "No";
    $join       = "Join";
    $present    = "Present";
    $edit       = "Edit";
    $error1     = "Bad password!";
  }
	
	// DATABASE CONNECTION
	$servername = "localhost";
	$username   = "webserver";
	$password   = "BP4Life";
	$database   = "quiz";

  $conn = mysqli_connect($servername, $username, $password, $database);
  if ($conn) {
    $query = $conn->query("SELECT * FROM presentations");
    $conn->close();
  }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title><?php echo($pagetitle); ?></title>
    <link rel="stylesheet" type="text/css" href="/css/quiz.css"/> 
    <script type="text/javascript" src="/js/quiz.js"></script>
  </head>
  <body>
    <div id="Presentations">
      <h1><?php echo($pagetitle); ?></h1>
      <?php 
        if ($_GET["error"] == 1) echo("<div class=\"error\">" . $error1 . "</div>");
      ?>
      <div id="PresTableContainer">
        <table id="PresTable">
          <tr id="PresHeader">
            <th><?php echo($title); ?></th>
            <th><?php echo($ongoing); ?></th>
            <th><?php echo($lastupdate); ?></th>
          </tr>
          <?php
            if ($query) {
              while ($row = $query->fetch_assoc()) {
                echo("<tr presid=\"" . $row["PresentationID"] . "\" selected=\"0\" onclick=\"select(" . $row["PresentationID"] . ")\">\n" . 
                  "<td>" . urldecode($row["Title"]) . "</td>\n" .
                  "<td value=\"" . $row["Presenting"] . "\">" . ($row["Presenting"] == 1 ? $yes : $no) . "</td>\n" .
                  "<td>" . $row["LastUpdate"] . "</td>\n" .
                "</tr>\n");
              }
            }
          ?>
        </table>
      </div>
      <form id="NextPage" hidden="true" action="" method="POST">
        <input hidden="true" name="PresentationID" value=""/>
        <input hidden="true" name="Password" value=""/>
      </form>
      <input id="Join"    type="button" hidden="true" value="<?php echo($join); ?>"    onclick="join()"/>
      <input id="Present" type="button" hidden="true" value="<?php echo($present); ?>" onclick="present()"/>
      <input id="Edit"    type="button" hidden="true" value="<?php echo($edit); ?>"    onclick="edit()"/>
    </div>
  </body>
</html>