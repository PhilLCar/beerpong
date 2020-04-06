STATUS_NOT_PAIRED = 0;
STATUS_WRITING    = 1;
STATUS_WAITING    = 2;
STATUS_PLAYING    = 3;
STATUS_GURESSING  = 4;
STATUS_ASKING     = 5;

function hidePair(pair) {
    var items = document.getElementById("Pair" + pair).getElementsByClassName("PairItem");

    for (let item of items) item.hidden = !item.hidden;
}