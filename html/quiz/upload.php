<?php
  $url = "";
  $target_file = "";
  if (!empty($_POST["URL"])) {
    $url = $_POST["URL"];
  } else {
    //https://www.w3schools.com/php/php_file_upload.asp
    $target_dir = $_SERVER["DOCUMENT_ROOT"] . "/images/";
    $uploadOk = true;
    $imageFileType = strtolower(pathinfo($_FILES["File"]["name"], PATHINFO_EXTENSION));

    $error = 0;

    if ($imageFileType == "") {
      $error = 1;
      $uploadOk = false;
    }
    // Check if image file is a actual image or fake image
    if($uploadOk && isset($_POST["submit"])) {
      if(!getimagesize($_FILES["File"]["tmp_name"])) {
        $error = 2;
        $uploadOk = false;
      }
    }

    if ($uploadOk) {
      do {
        $file = strtoupper(md5(strval(rand()))) . "." . $imageFileType;
        $target_file = $target_dir . $file;
      } while (file_exists($target_file));
    }

    // Check file size
    if ($uploadOk && $_FILES["File"]["size"] > 1000000) {
      $error = 4;
      $uploadOk = false;
    }

    // Check if $uploadOk is set to 0 by an error
    if ($uploadOk)  {
      //echo($target_file);
      //exit();
      if (!move_uploaded_file($_FILES["File"]["tmp_name"], $target_file)) {
        $error = 8;
      }
    }
    if ($error) {
      header("Location: image.php?error=" . $error);
      exit();
    }
    $url = "/images/" . $file;
  }
  if ($url) { 
    $size = NULL;
    if ($target_file != "") {
      $size = getimagesize($target_file);
    } else {
      $size = getimagesize($url);
    }
    $width = $size[0] / $size[1] * 0.75 * 50;
    echo($width);

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
        $conn->query("INSERT INTO images (PresentationID, SlideID, Content, SizeX, SizeY) VALUES (" . $_POST["PresentationID"] . ", " . $result["SlideID"] . ", '" .
                     rawurlencode($url) . "', " . $width . ", 50.0)");
      }
      $conn->close();
    }
    header("Location: image.php?Success=1");
  }
?>
