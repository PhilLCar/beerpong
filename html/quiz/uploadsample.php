<?php
ini_set('upload_max_filesize', '500M');
ini_set('post_max_size', '500M');
  //https://www.w3schools.com/php/php_file_upload.asp
  $target_dir = $_SERVER["DOCUMENT_ROOT"] . "/samples/";
  $uploadOk = true;
  $target_file = "";
  $file = "";
  $sampleFileType = strtolower(pathinfo($_FILES["File"]["name"], PATHINFO_EXTENSION));

  $error = 0;

  if ($sampleFileType == "") {
    $error = 1;
    $uploadOk = false;
  }
  
  if($uploadOk && isset($_POST["submit"])) {
    if(!($sampleFileType == "mp3" || $sampleFileType == "wav" || $sampleFileType == "aac")) {
      $error = 2;
      $uploadOk = false;
    }
  }

  if ($uploadOk) {
    do {
      $file = strtoupper(md5(strval(rand()))) . "." . $sampleFileType;
      $target_file = $target_dir . $file;
    } while (file_exists($target_file));
  }

  // Check file size
  if ($uploadOk && $_FILES["File"]["size"] > 25000000) {
    $error = 4;
    $uploadOk = false;
  }

  if ($uploadOk)  {
    // echo($target_file);
    // exit();
    if (!move_uploaded_file($_FILES["File"]["tmp_name"], $target_file)) {
      $error = 8;
      exit();
    }
  }
  if ($error) {
    header("Location: sample.php?error=" . $error);
    exit();
  }
  $url = "/samples/" . $file;
  // DATABASE CONNECTION
  $servername = "localhost";
  $username   = "webserver";
  $password   = "BP4Life";
  $database   = "quiz";

  $conn = mysqli_connect($servername, $username, $password, $database);
  if ($conn) {
    $query = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlidePosition=" . $_POST["SlidePosition"]);
    if ($query->num_rows) {
      $result = $query->fetch_assoc();
      $conn->query("INSERT INTO samples (PresentationID, SlideID, Content) VALUES (" . $_POST["PresentationID"] . ", " . $result["SlideID"] . ", '" . rawurlencode($url) . "')");
    }
    $conn->close();
  }
  header("Location: sample.php?Success=1");
?>
