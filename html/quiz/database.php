<?php
  function updateSlide($conn) {
    $query = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlidePosition=" . $_POST["SlidePosition"]);
    if ($query->num_rows) {
      $result = $query->fetch_assoc();
      echo($result["Comments"]);
      $slideid = $result["SlideID"];
      $query = $conn->query("SELECT * FROM labels WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlideID=" . $slideid);
      while ($result = $query->fetch_assoc()) {
        echo(";L:" . $result["LabelID"] . ":" . $result["Content"] . ":" . $result["Color"] . ":" . $result["FontSize"] . ":" . $result["X"] . ":" . $result["Y"]);
      }
    }
  }

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
        updateSlide($conn);
        break;
      case "DEL_SLIDE":
        $query = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlidePosition=" . $_POST["SlidePosition"]);
        if ($query->num_rows) {
          $result = $query->fetch_assoc();
          $conn->query("DELETE FROM samples WHERE SlideID=" . $result["SlideID"]);
          $conn->query("DELETE FROM images  WHERE SlideID=" . $result["SlideID"]);
          $conn->query("DELETE FROM labels  WHERE SlideID=" . $result["SlideID"]);
          $conn->query("DELETE FROM slides  WHERE SlideID=" . $result["SlideID"]);
          $conn->query("UPDATE slides SET SlidePosition=SlidePosition-1 WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlidePosition>" . $result["SlidePosition"]);
        }
        $query = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"]);
        echo($query->num_rows);
        break;
      case "MOVE_SLIDE":
        $query1 = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlidePosition=" . $_POST["Slide1"]);
        $query2 = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlidePosition=" . $_POST["Slide2"]);
        if ($query1->num_rows && $query2->num_rows) {
          $result1 = $query1->fetch_assoc();
          $result2 = $query2->fetch_assoc();
          if ($_POST["Slide1"] < $_POST["Slide2"]) {
            $conn->query("UPDATE slides SET SlidePosition=SlidePosition-1 WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlidePosition>" . $result1["SlidePosition"] . " AND SlidePosition<=" . $result2["SlidePosition"]);
            $conn->query("UPDATE slides SET SlidePosition=" . $result2["SlidePosition"] . " WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlideID=" . $result1["SlideID"]);
          } else {
            $conn->query("UPDATE slides SET SlidePosition=SlidePosition+1 WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlidePosition>=" . $result2["SlidePosition"] . " AND SlidePosition<" . $result1["SlidePosition"]);
            $conn->query("UPDATE slides SET SlidePosition=" . $result2["SlidePosition"] . " WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlideID=" . $result1["SlideID"]);
          }
        }
        break;
      case "NEW_LABEL":
        $query = $conn->query("SELECT * FROM slides WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlidePosition=" . $_POST["SlidePosition"]);
        if ($query->num_rows) {
          $result = $query->fetch_assoc();
          $conn->query("INSERT INTO labels (PresentationID, SlideID) VALUES (" . $_POST["PresentationID"] . ", " . $result["SlideID"] . ")");
          updateSlide($conn);
        }
        break;
      case "":
      default:
        break;
    }
    $conn->close();
  }
?>