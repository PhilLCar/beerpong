<?php
  //https://www.w3schools.com/php/php_file_upload.asp
  $target_dir = "images/";
  $target_file = "";
  $uploadOk = true;
  $imageFileType = strtolower(pathinfo(basename($_FILES["fileToUpload"]["name"]), PATHINFO_EXTENSION));

  $error = 0;

  if ($imageFileType == "") {
    $error = 1;
    $uploadOk = false;
  }
  // Check if image file is a actual image or fake image
  if($uploadOk && isset($_POST["submit"])) {
    if(!getimagesize($_FILES["fileToUpload"]["tmp_name"])) {
      $error = 2;
      $uploadOk = false;
    }
  }

  if ($uploadOk) {
    do {
      $targetfile = $target_dir . strtoupper(md5(strval(rand()))) . "." . $imageFileType;
    } while (file_exists($target_file));
  }

  // Check file size
  if ($uploadOk && $_FILES["fileToUpload"]["size"] > 1000000) {
    $error = 4;
    $uploadOk = false;
  }

  // Check if $uploadOk is set to 0 by an error
  if ($uploadOk)  {
    if (!move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file)) {
      $error = 8;
    }
  }
?>
