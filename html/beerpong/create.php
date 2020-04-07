
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>CREATE GAME</title>
    <link rel="stylesheet" type="text/css" href="/css/beerpong.css"/> 
  	<script type="text/javascript" src="js/beerpong.js"></script>
  </head>
  <body>
      <h1>CREATE GAME</h1>
      <?php
		$error = $_GET["error"];
		if ($error & 1) echo('<p class="error">The contestant name cannot be empty</p>');
		if ($error & 2) echo('<p class="error">The team name cannot be empty</p>');
		if ($error & 4) echo('<p class="error">Could not create game</p>');
		if ($error & 8) echo('<p class="error">Could not connect to the database</p>');
		if ($error & 16) echo('<p class="error">This team is already playing</p>');
		if ($error & 32) echo('<p class="error">The contestant is already in use at the moment</p>');
		if ($error & 64) echo('<p class="error">The partner name is already in use at the moment</p>');
		if ($error & 128) echo('<p class="error">Unknown error creating game</p>');
      ?>
      <form method="POST" action="newgame.php">
      	<p>Contestant:<br>
       	  <input type="text" name="MemberA"/><br>
	</p>
      	<p>I have a partner:
	  <input type="checkbox" name="IsB" checked="checked" onclick="updatepartner()"/><br>
       	  <input type="text" name="MemberB"/><br>
	</p>
      	<p>Team name:<br>
       	  <input type="text" name="TeamName"/><br>
	</p>
      	<input type="submit" value="CREATE"/>
      </form>
  </body>
</html>
