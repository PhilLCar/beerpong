<?php
  // DATABASE CONNECTION
	$servername = "localhost";
	$username   = "webserver";
	$password   = "BP4Life";
	$database   = "quiz";

  $conn = mysqli_connect($servername, $username, $password, $database);
  if ($conn) {
    $query = $conn->query("SELECT * FROM presentations WHERE PresentationID=" . $_POST["PresentationID"] . " AND PassHash='" . $_POST["PassHash"] . "'");

    if (!$query->num_rows) {
      $conn->close();
      exit();
    }

    switch ($_POST["Command"]) {
      case "UP_SLIDES":
        $query = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"]);
        echo($query->num_rows);
        break;
      case "NEW_SLIDE":
        $query = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"]);
        $num_slides = $query->num_rows;
        $conn->query("INSERT INTO slides (PresentationID, SlidePosition) VALUES (" . $_POST["PresentationID"] . ", " . $num_slides . ")");
        echo($num_slides + 1);
        break;
      case "COMMENT":
        $conn->query("UPDATE slides SET Comments='" . rawurlencode($_POST["Comment"]) . "' WHERE PresentationID=" .
                     $_POST["PresentationID"] . " AND SlidePosition=" . $_POST["SlidePosition"]);
        break;
      case "UP_SLIDE":
        $query = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlidePosition=" . $_POST["SlidePosition"]);
        if ($query->num_rows) {
          $result = $query->fetch_assoc();
          echo($result["Comments"]);
        }
        break;
      case "DEL_SLIDE":
        $query = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlidePosition=" . $_POST["SlidePosition"]);
        if ($query->num_rows) {
          $result = $query->fetch_assoc();
          $conn->query("DELETE FROM samples WHERE SlideID=" . $result["SlideID"]);
          $conn->query("DELETE FROM images  WHERE SlideID=" . $result["SlideID"]);
          $conn->query("DELETE FROM labels  WHERE SlideID=" . $result["SlideID"]);
          $conn->query("DELETE FROM slides  WHERE SlideID=" . $result["SlideID"]);
          $conn->query("UPDATE slides SET SlidePosition=SlidePosition-1 WHERE SlidePosition>" . $result["SlidePosition"]);
        }
        $query = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"]);
        echo($query->num_rows);
        break;
      case "SWAP":
        $query = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlidePosition=" . $_POST["Slide1"]);
        if ($query->num_rows) {
          $result = $query->fetch_assoc();
          if ($_POST["Slide1"] < $_POST["Slide2"]) {

          } else {
            $conn->query("UPDATE slides ")
          }
        }
        break;
      case "":
      default:
        break;
    }
    $conn->close();
  }
?>