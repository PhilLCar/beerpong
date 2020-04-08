<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Nouvelle partie</title>
    <link rel="stylesheet" type="text/css" href="/css/boulette.css"/>
  </head>
  <body>
    <div id="MainMenu">
        <h1>Créer une partie</h1>
        <form method="POST" action="lobby.php">
        <p>Choisissez un nom d'utilisateur:</p>
        <input type="text" name="UserName"/><br>
        <p>
            Entrez le nom du salon que vous souhaitez rejoindre:<br>
            (4 lettres majuscules)
        <p>
        <input type="text" name="LobbyID"/><br>
        <input type="submit" value="GO!"/>
        </form>
    </div>
  </body>
</html>