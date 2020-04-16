<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>CODE NAMES</title>
    <link rel="stylesheet" type="text/css" href="/css/codenames.css"/>
    <script type="text/javascript" src="/js/codenames.js"></script>
  </head>
  <body>
  <div id="TitleBar">
    <div id="Title">CODE NAMES</div>
    <div id="Timer">0:00</div>
    <div id="Game">#Partie:<b id="ID">AAAA</b></div>
  </div>
  <div id="Container">
        <div id="Lobby" class="Bar">
        <div id="LobbyTitleBar" class="TitleBar">
            <div id="LobbyExpMin" class="ExpMin" onclick="expMin('Lobby')">-</div>
            <div id="LobbyTitle" class="Title">Lobby</div>
        </div>
        <div id="LobbyList">
            <div class="User">
                <div class="Status StatusOffline"></div>
                <div id="User0" class="UserName">UserName</div>
            </div>
            <div class="User">
                <div class="Status StatusOnline"></div>
                <div id="User1" class="UserName">UserName</div>
            </div>
            <div class="User">
                <div class="Status StatusWriting"></div>
                <div id="User2" class="UserName">UserName</div>
            </div>
        </div>
        </div>
        <div id="TeamBar" class="Bar">
        <div id="TeamTitleBar" class="TitleBar">
            <div id="TeamExpMin" class="ExpMin" onclick="expMin('Team')">-</div>
            <div id="TeamTitle" class="Title">Équipes</div>
        </div>
        <div id="TeamList">
            <div id="TeamRed" class="Team">
                <div id="TeamRedTitle">Rouge</div>
                <div class="User">
                    <div class="Status StatusWriting"></div>
                    <div id="User3" class="UserName">UserName</div>
                </div>
                <div class="User">
                    <div class="Status StatusWriting"></div>
                    <div id="User4" class="UserName">UserName</div>
                </div>
            </div>
            <div id="TeamBlue" class="Team">
                <div id="TeamBlueTitle">Bleu</div>
                <div class="User">
                    <div class="Status StatusWriting"></div>
                    <div id="User5" class="UserName">UserName</div>
                </div>
                <div class="User">
                    <div class="Status StatusWriting"></div>
                    <div id="User6" class="UserName">UserName</div>
                </div>
            </div>
            <div id="TeamYellow" class="Team">
                <div id="TeamYellowTitle">Jaune</div>
                <div class="User">
                    <div class="Status StatusWriting"></div>
                    <div id="User7" class="UserName">UserName</div>
                </div>
                <div class="User">
                    <div class="Status StatusWriting"></div>
                    <div id="User8" class="UserName">UserName</div>
                </div>
            </div>
        </div>
        </div>
        <div id="GameBoard">
        <div id="R0" class="Row">
            <div id="C00" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C01" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C02" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C03" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C04" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
        </div>
        <div id="R1" class="Row">
            <div id="C10" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C11" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C12" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C13" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C14" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
        </div>
        <div id="R2" class="Row">
            <div id="C20" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C21" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C22" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C23" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C24" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
        </div>
        <div id="R3" class="Row">
            <div id="C30" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C31" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C32" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C33" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C34" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
        </div>
        <div id="R4" class="Row">
            <div id="C40" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C41" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C42" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C43" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
            <div id="C44" class="Cell">
                <div class="Selectors"></div>
                <div class="Name">NOM COMMUN</div>
            </div>
        </div>
        </div>
  </div>
  <div id="ChatMask">
  </div>
  <div id="StatusBar">
  </div>
  </body>
</html>