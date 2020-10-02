<?php
  if (empty($_POST["title"])) {
    header("Location: create.php?error=1");
    exit();
  } else if (empty($_POST["password"])) {
    header("Location: create.php?error=2");
    exit();
  }
	
	// DATABASE CONNECTION
	$servername = "localhost";
	$username   = "webserver";
	$password   = "BP4Life";
	$database   = "quiz";

	$conn = mysqli_connect($servername, $username, $password, $database);
  if ($conn) {
    $sql = "INSERT INTO presentations(Title, PassHash) VALUES ('" . rawurlencode($_POST["title"]) . "', '" . md5($_POST["password"]) . "')";
    if ($conn->query($sql)) {
      header("Location: presentations.php");
    } else {
      header("Location: create.php?error=8");
    }
    $conn->close();
  } else {
    header("Location: create.php?error=4");
  }
?>