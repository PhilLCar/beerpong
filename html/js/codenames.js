function expMin(component) {
    var expmin = document.getElementById(component + "ExpMin");
    var list   = document.getElementById(component + "List");
    if (expmin.innerHTML == "-") {
        list.hidden = true;
        expmin.innerHTML = "+";
        expmin.style.lineHeight = "1.1rem";
        expmin.style.bottom = "0.06rem";
    } else {
        list.hidden = false;
        expmin.innerHTML = "-";
        expmin.style.lineHeight = "0.85rem";
        expmin.style.bottom = "0.18rem";
    }
}