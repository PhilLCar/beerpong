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
      $query = $conn->query("SELECT * FROM images WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlideID=" . $slideid);
      while ($result = $query->fetch_assoc()) {
        echo(";I:" . $result["ImageID"] . ":" . $result["Content"] . ":" . $result["X"] . ":" . $result["Y"] . ":" . $result["SizeX"] . ":" . $result["SizeY"]);
      }
      $query = $conn->query("SELECT * FROM samples WHERE PresentationID=" . $_POST["PresentationID"] . " AND SlideID=" . $slideid);
      while ($result = $query->fetch_assoc()) {
        echo(";S:" . $result["SampleID"] . ":" . $result["Content"] . ":" . $result["SampleStart"] . ":" . $result["SampleEnd"] . ":" . $result["X"] . ":" . $result["Y"]);
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
    if ($_POST["PassHash"] == "NO_EDIT") {
      $query = $conn->query("SELECT * FROM presentations WHERE PresentationID=" . $_POST["PresentationID"]);

      if (!$query->num_rows) {
        $conn->close();
        exit();
      }

      if ($_POST["Command"] == "UP_CUR_SLIDE") {
        $i = 0;
        $base = $query->fetch_assoc();
        $_POST["SlidePosition"] = $base["Slide"];
        if (empty($_POST["Immediate"])) {
          for (; $i < 30; $i++) {
            sleep(1);
            $result = $conn->query("SELECT * FROM presentations WHERE PresentationID=" . $_POST["PresentationID"])->fetch_assoc();
            if ($result["Slide"] != $base["Slide"]) {
              $_POST["SlidePosition"] = $result["Slide"];
              break;
            } 
          }
        }
        if ($i < 30) updateSlide($conn);
      }
    } else {
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
        case "UP_SLIDE_NE":
          $conn->query("UPDATE presentations SET Slide=" . $_POST["SlidePosition"] . ", Presenting=1 WHERE PresentationID=" . $_POST["PresentationID"]);
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
        case "DEL_LABEL":
          $conn->query("DELETE FROM labels WHERE LabelID=" . $_POST["LabelID"]);
          updateSlide($conn);
          break;
        case "DEL_IMAGE":
          $conn->query("DELETE FROM images WHERE ImageID=" . $_POST["ImageID"]);
          updateSlide($conn);
          break;
        case "UP_LCOL":
          $conn->query("UPDATE labels SET Color='" . $_POST["Color"] . "' WHERE LabelID=" . $_POST["LabelID"]);
          break;
        case "UP_LSIZE":
          $conn->query("UPDATE labels SET FontSize=" . $_POST["FontSize"] . " WHERE LabelID=" . $_POST["LabelID"]);
          break;
        case "UP_ISIZE":
          $conn->query("UPDATE images SET SizeX=" . $_POST["SizeX"] . ", SizeY=" . $_POST["SizeY"] . " WHERE ImageID=" . $_POST["ImageID"]);
          break;
        case "UP_LTEXT":
          $conn->query("UPDATE labels SET Content='" . rawurlencode($_POST["Content"]) . "' WHERE LabelID=" . $_POST["LabelID"]);
          break;
        case "UP_LPOS":
          $conn->query("UPDATE labels SET X=" . $_POST["X"] . ", Y=" . $_POST["Y"] . " WHERE LabelID=" . $_POST["LabelID"]);
          break;
        case "UP_IPOS":
          $conn->query("UPDATE images SET X=" . $_POST["X"] . ", Y=" . $_POST["Y"] . " WHERE ImageID=" . $_POST["ImageID"]);
          break;
        case "UP_SPOS":
          $conn->query("UPDATE samples SET X=" . $_POST["X"] . ", Y=" . $_POST["Y"] . " WHERE SampleID=" . $_POST["SampleID"]);
          break;
        case "UP_SSTART":
          $conn->query("UPDATE samples SET SampleStart=" . $_POST["Start"] . " WHERE SampleID=" . $_POST["SampleID"]);
          break;
        case "UP_SEND":
          $conn->query("UPDATE samples SET SampleEnd=" . $_POST["End"] . " WHERE SampleID=" . $_POST["SampleID"]);
          break;
        case "":
        default:
          break;
      }
    }
    $conn->close();
  }
?>