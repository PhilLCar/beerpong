<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>JOIN TEAM</title>
    <link rel="stylesheet" type="text/css" href="/css/beerpong.css"/> 
  	<script type="text/javascript" src="/js/beerpong.js"></script>
	<script type="text/javascript">
		document.addEventListener('DOMContentLoaded', function() {
			select();
		}, false);
	</script>
  </head>
  <body>
    <h1>JOIN TEAM</h1>
	<?php
		$error = $_GET["error"];
		if (empty($_POST["GameID"])) $_POST["GameID"] = $_COOKIE["GameID"];
		if ($error & 2) echo('<p class="error">The team name cannot be empty</p>');
		if ($error & 4) echo('<p class="error">The user name cannot be empty</p>');
		if ($error & 8) echo('<p class="error">Can\'t connect to databse</p>');
		if ($error & 32) echo('<p class="error">The contestant is already in use at the moment</p>');
		if ($error & 64) echo('<p class="error">The partner name is already in use at the moment</p>');
	?>
    <form id="GameList" method="POST" action="game.php">
      <p>Contestant name:<br>
		<input type="text" name="MemberA"/>
      <p>
      <p>Choose team:<br>
	<select name="TeamName" onchange="select()"/>
      <?php
	// DATABASE CONNECTION
	$servername = "localhost";
	$username   = "webserver";
	$password   = "BP4Life";
	$database   = "beerpong";

	$conn = mysqli_connect($servername, $username, $password, $database);

	if ($conn) {
		$sql = "SELECT * FROM games WHERE GameID='" . $_POST["GameID"] . "'";
		$result = $conn->query($sql);
		$row = $result->fetch_assoc();
		if ($row["Active"]) {
			$sql = "SELECT * FROM teams WHERE TeamName='" . $row["TeamA"] . "'";
			$subres = $conn->query($sql);
			$team = $subres->fetch_assoc();
			if ($team["MemberB"] === NULL) echo('<option id="ITA" value="' . $row["TeamA"] . '">' .
									$row["TeamA"] . '</option>');
			if ($row["TeamB"] !== NULL) {
				$sql = "SELECT * FROM teams WHERE TeamName='" . $row["TeamB"] . "'";
				$subres = $conn->query($sql);
				$team = $subres->fetch_assoc();
				if ($team["MemberB"] === NULL) echo('<option id="ITB" partner="false" value="' . $row["TeamB"] . '">' .
										$row["TeamB"] . '</option>');
			} else {
				$newteam = TRUE;
				echo('<option id="ITB" partner="true" value="">New team</option>');
			}				
		}
        $conn->close();
	} else {
		header("Location: join.php?error=8");
	}
      ?>
        </select>
      </p>
      <?php
	if ($newteam) {
	    echo('<p id="NewTeam" hidden="true" >New team name:<br><input type="text" ' .
                 'name="NewTeamName" disabled="true" onchange="change()"/></p>');
	}
	echo('<input type="hidden" name="GameID" value="' . $_POST["GameID"] . '"/>');
      ?>
	  <p id="PartnerField">I have a partner:
	  	<input type="checkbox" name="IsB" checked="checked" onclick="updatepartner()"/><br>
		<input type="text" name="MemberB"/>
      <p>
      <input type="submit" value="PLAY"/>
    </form>
  </body>
</html>
