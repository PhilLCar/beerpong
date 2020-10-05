<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>DICE</title>
    <link rel="stylesheet" type="text/css" href="/css/dice.css"/>
    <script type="text/javascript" src="/js/dice.js"></script>
  </head>
  <body>
    <div id="DiceContainer">
      <div id="DiceArray">
        <div id="Die1" class="die" onclick="disableDice(this)" value="0">
          <div id="Center" class="dot"></div>
        </div><div class="sep">
        </div><div id="Die2" class="die" onclick="disableDice(this)" value="1">
          <div id="TopLeft" class="dot"></div>
          <div id="BottomRight" class="dot"></div>
        </div><div class="sep">
        </div><div id="Die3" class="die" onclick="disableDice(this)" value="2">
          <div id="TopLeft" class="dot"></div>
          <div id="Center" class="dot"></div>
          <div id="BottomRight" class="dot"></div>
        </div><div class="sep">
        </div><div id="Die4" class="die" onclick="disableDice(this)" value="3">
          <div id="TopLeft" class="dot"></div>
          <div id="TopRight" class="dot"></div>
          <div id="BottomLeft" class="dot"></div>
          <div id="BottomRight" class="dot"></div>
        </div><div class="sep">
        </div><div id="Die5" class="die" onclick="disableDice(this)" value="4">
          <div id="TopLeft" class="dot"></div>
          <div id="TopRight" class="dot"></div>
          <div id="CenterLeft" class="dot"></div>
          <div id="CenterRight" class="dot"></div>
          <div id="BottomLeft" class="dot"></div>
          <div id="BottomRight" class="dot"></div>
        </div>
      </div>
      <div>
        <input id="Roll" type="button" onclick="rollDice()" value="ROLL!"/>
      </div>
      <div id="DBButtons">
        <input id="Connect" type="button" onclick="connect()"    value="Connect"/>
        <input id="New"     type="button" onclick="newSession()" value="New Session"/>
      </div>
      <div id="SessionID"></div>
    </div>
  </body>
</html>