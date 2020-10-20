// function setUnoSizes() {
//   for (var uno of document.getElementsByClassName("uno")) {
//     var w = uno.clientHeight * 0.015;
//     var b = uno.clientHeight * 0.03;
//     var s = uno.clientHeight * 0.004;
//     var o = uno.clientHeight * 0.045;
//     uno.style.fontSize = uno.clientHeight * 0.7 + "px";
//     var shadow = `${w}px ${w}px 0 white, ${-w}px ${-w}px 0 white, ${-w}px ${w}px 0 white, ${w}px ${-w}px 0 white, `
//                + `${b}px ${b}px 0 black, ${-b}px ${-b}px 0 black, ${-b}px ${b}px 0 black, ${b}px ${-b}px 0 black`;
//     for (var i = 0; i < 10 * s; i += s) {
//       shadow += `, ${b - i}px ${b + i}px 0 black, ${-b - i}px ${-b + i}px 0 black, ${-b - i}px ${b + i}px 0 black, ${b - i}px ${-b + i}px 0 black`
//     }
//     for (var i = 0; i < 10 * s; i += s) {
//       shadow += `, ${o - i}px ${o + i}px 0 white, ${-o - i}px ${-o + i}px 0 white, ${-o - i}px ${o + i}px 0 white, ${o - i}px ${-o + i}px 0 white`
//     }
//     uno.style.textShadow = shadow;
//   }
// }