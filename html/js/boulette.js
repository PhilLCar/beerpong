STATUS_NOT_PAIRED = 0;
STATUS_PAIRED     = 1;
STATUS_TRYING     = 2;
STATUS_WAITING    = 4;
STATUS_PLAYING    = 8;
STATUS_GURESSING  = 16;
STATUS_ASKING     = 32;
STATUS_WRITING    = 64;

function hidePair(pair) {
    var items = document.getElementById("Pair" + pair).getElementsByClassName("PairItem");

    for (let item of items) item.hidden = !item.hidden;
}