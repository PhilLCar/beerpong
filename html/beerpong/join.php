<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>JOIN GAME</title>
    <link rel="stylesheet" type="text/css" href="/css/beerpong.css"/> 
  	<script type="text/javascript" src="/js/beerpong.js"></script>
  </head>
  <body>
    <h1>JOIN GAME</h1>
	<?php
		$error = $_GET["error"];
		if ($error & 1) echo('<p class="error">No game found</p>');
		if ($error & 32) echo('<p class="error">Team is already playing!</p>');
	?>
    <form id="GameList" method="POST" action="team.php">
      <?php
	// DATABASE CONNECTION
	$servername = "localhost";
	$username   = "webserver";
	$password   = "BP4Life";
	$database   = "beerpong";

	$conn = mysqli_connect($servername, $username, $password, $database);

	if ($conn) {
		$sql = "SELECT * FROM games WHERE Active=TRUE";
		$result = $conn->query($sql);

		if (!$result->num_rows) {
			echo("No games available at the moment.");
		}

		while ($row = $result->fetch_assoc()) {
			$numplayers = 1;
			$sql = "SELECT * FROM teams WHERE TeamName='" . $row["TeamA"] . "'";
			$subres = $conn->query($sql);
			$teamA = $subres->fetch_assoc();
			if ($teamA["MemberB"] !== NULL) $numplayers += 1;

			echo('<div class="JoinItem">');
			if ($row["TeamB"] === NULL) {
				echo('<p class="JoinItemTitle"><b class="TeamA" style="color:' . $teamA["Color"] . '">' .
					$row["TeamA"] . '</b>: waiting for an opposing team...</p>');
			} else {
				$numplayers += 1;
				$sql = "SELECT * FROM teams WHERE TeamName='" . $row["TeamB"] . "'";
				$subres = $conn->query($sql);
				$teamB = $subres->fetch_assoc();
				if ($teamB["MemberB"] !== NULL) $numplayers += 1;

				echo('<p class="JoinItemTitle"><b class="TeamA" style="color:' . $teamA["Color"] . '">' . $row["TeamA"] .
					'</b> vs <b class="TeamB" style="color:' . $teamB["Color"] . '">' . $row["TeamB"] . '</b></p>');
			}
			echo('<p class="JoinItemPlayers">Number of players: ' . $numplayers . '<p>');
			if ($numplayers < 4) {
				echo('<input class="JoinItemButton" type="button"' .
							'onclick="join(' . $row["GameID"] . ')" value="JOIN">');
			} else {
				echo('<input class="JoinItemFull" type="button" disabled="true" value="FULL">');
			}
			echo('</div>');
		}
        $conn->close();
	} else {
		header("Location: join.php?error=8");
	}
      ?>
      <input type="hidden" name="GameID" value=""/>
    </form>
  </body>
</html>
