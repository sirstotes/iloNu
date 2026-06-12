
function getCursor() {
    if(document.getElementById('cursor')) {
        return document.getElementById('cursor');
    }
    let cursor = document.createElement('cursor');
    cursor.id = 'cursor';
    return cursor
}
function removeCursor() {
    getCursor().remove();
}
function type(word) {
    let span = document.createElement('span');
    span.innerHTML = word;// + ' ';
    let selection = Array.from(document.getElementsByClassName('selected'));
    if(selection.length > 0) {
        selection[0].replaceWith(span);
        for(let i = 1; i < selection.length; i ++) {
            selection[i].remove();
        }
        moveCursorAfter(span);
    } else {
        if(getCursor().nextElementSibling && getCursor().nextElementSibling.innerHTML == ' ') {
            getCursor().nextElementSibling.remove();
        }
        getCursor().before(span);
    }
    const customEvent = new CustomEvent('wordsChanged', {
        bubbles: true,
        cancelable: true
    });
    span.dispatchEvent(customEvent);
    const customEvent2 = new CustomEvent('wordTyped', {
        detail: {span: span},
        bubbles: true,
        cancelable: true
    });
    span.dispatchEvent(customEvent2);
    return span;
}
function backspace() {
    const customEvent = new CustomEvent('wordsChanged', {
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(customEvent);
    let selection = Array.from(document.getElementsByClassName('selected'));
    if(selection.length > 0) {
        moveCursorAfter(selection[0]);
        for(let i = 0; i < selection.length; i ++) {
            selection[i].remove();
        }
    } else if(getCursor().previousElementSibling) {
        getCursor().previousElementSibling.remove();
    }
}
function newLine() {//TODO: Make spaces fill entire note, to end of scroll. No more <br> tags
    const customEvent = new CustomEvent('wordsChanged', {
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(customEvent);
    let selection = Array.from(document.getElementsByClassName('selected'));
    if(selection.length > 0) {
        moveCursorAfter(selection[0]);
        selection[0].replaceWith(document.createElement('br'));
        for(let i = 1; i < selection.length; i ++) {
            selection[i].remove();
        }
    } else {
        if(getCursor().nextElementSibling && getCursor().nextElementSibling.innerHTML == '_') {
            getCursor().nextElementSibling.remove();
        }
        getCursor().before(document.createElement('br'));
    }
}
function moveCursorAfter(element) {
    let cursor = getCursor();
    if(cursor.parentElement) {
        if(cursor.parentElement != element && cursor.parentElement.isCartouche && cursor.parentElement != element.parentElement) {
            cursor.parentElement.endCartouche();
        }
        cursor.parentElement.removeChild(cursor);
    }
    element.after(cursor);
}
function moveCursorInto(element) {
    let cursor = getCursor();
    if(cursor.parentElement) {
        if(cursor.parentElement != element && cursor.parentElement.isCartouche && cursor.parentElement != element.parentElement) {
            cursor.parentElement.endCartouche();
        }
        cursor.parentElement.removeChild(cursor);
    }
    if(arguments[1] != undefined) {
        element.childNodes[arguments[1] - 1].after(cursor);
    } else {
        element.appendChild(cursor);
    }
}
function afterClick(button) {
    for(let m of document.getElementsByClassName('multirow')) {
        if(m.reset) {
            m.goToRow(0);
        }
    }
}

function key(nimi) {
    let button = document.createElement('button');
    button.innerHTML = '<span class="nimi">'+nimi+'</span>';
    button.classList.add('key');
    button.onclick = (event) => {
        let n = type(nimi);
        addClass(n, 'nimi');
        afterClick(button);
    };
    return button;
}
function functionKey(nimi, onclick) {
    let button = document.createElement('button');
    button.innerHTML = nimi;
    button.classList.add('key', 'function_key');
    button.onclick = onclick;
    return button;
}
function cartoucheKey() {
    let button = document.createElement('button');
    button.innerHTML = '[]';
    button.classList.add('key', 'function_key');
    let startCartouche = function() {
        let cartouche = type('[');
        cartouche.isCartouche = true;
        addClass(cartouche, 'nimi');
        cartouche.endCartouche = function() {
            moveCursorAfter(cartouche);
            cartouche.innerHTML = cartouche.innerText+']';
            button.innerHTML = '[]';
            button.onclick = startCartouche;
        }
        button.innerHTML = 'pini';
        moveCursorInto(cartouche);
        button.onclick = cartouche.endCartouche;
    };
    button.onclick = startCartouche;
    return button;
}
function keyboardRow() {
    let div = document.createElement('div');
    div.classList.add('keyrow');
    for(let arg of arguments) {
        if(arg instanceof Node) {
            div.appendChild(arg);
        } else {
            div.appendChild(key(arg));
        }
    }
    return div;
}
function multiRow(rows, height, controls, reset) {
    let div = document.createElement('div');
    div.classList.add('keyrow', 'multirow');
    div.style.flexGrow = 2;
    div.rows = rows;
    div.reset = reset;
    div.row = 0;
    if(controls) {
        div.appendChild(stylize(functionKey('pini', () => {div.goToRow(div.row - 1)}), 'flexGrow', 0));
    }
    let mrc = addClass(document.createElement('div'), 'multirow_container');
    setKeyboard(mrc, rows.slice(0, height));
    div.appendChild(mrc);
    if(controls) {
        div.appendChild(stylize(functionKey('kama', () => {div.goToRow(div.row + 1)}), 'flexGrow', 0));
    }

    div.goToRow = function(row, height) {
        let h = height || 2;
        let r = Math.min(Math.max(row, 0), this.rows.length - h)
        this.row = r;
        setKeyboard(mrc, this.rows.slice(r, r+h))
    }
    return div;
}
function multiRowGoTo(row, height) {
    return (event) => {
        event.target.parentNode.parentNode.parentNode.goToRow(row, height);
    };
}
function addClass(element, c) {
    element.classList.add(c);
    return element;
}
function stylize(element, key, value) {
    element.style[key] = value;
    return element;
}
function setKeyboard(keyboard, rows) {
    keyboard.innerHTML = '';
    for(let row of rows) {
        keyboard.appendChild(row);
    }
}
function removeSelection() {
    let allSelected = Array.from(document.getElementsByClassName('selected'));
    for(let selected of allSelected) {
        selected.classList.remove('selected');
    }
}
function selectElements(parent, startIndex, endIndex) {
    for(let i = startIndex; i < endIndex + 1; i ++) {
        parent.children[i].classList.add('selected');
    }
    removeCursor();
}
function calculateSelection(parentElement, startElement, endElement) {
    let sIndex = (startElement == 0) ? 0 : Array.prototype.indexOf.call(parentElement.children, startElement);
    let eIndex = (endElement == -1) ? parentElement.children.length - 1 : Array.prototype.indexOf.call(parentElement.children, endElement);
    selectElements(parentElement, Math.min(sIndex, eIndex), Math.max(sIndex, eIndex));
}
function setupTextarea(element, checkValidFunction) {
    element.addEventListener('click', function(event) {
        if(checkValidFunction()) {
            if(element.selecting) {
                element.selecting = false;
            } else {
                removeSelection();
                if(event.target == element) {
                    moveCursorInto(element);
                } else if(event.target.classList.contains('nimi')) {
                    moveCursorAfter(event.target);
                }
            }
        }
    });
    element.addEventListener('pointerdown', function(event) {
        if(checkValidFunction()) {
            if(event.target.classList.contains('nimi')) {
                element.selectStart = event.target;
                element.mouseDown = true;
            }
        }
    });
    element.addEventListener('pointerup', function(event) {
        element.mouseDown = false;
    });
    element.addEventListener('pointermove', function(event) {
        if(checkValidFunction()) {
            if(element.mouseDown && element.selectStart != undefined) {
                let target = event.target;
                if(target == element.selectStart) {
                    target = document.elementFromPoint(event.clientX, event.clientY);
                }
                if(target.classList.contains('nimi')) {
                    element.selectEnd = target;
                    element.selecting = true;
                    removeSelection();
                    calculateSelection(element, element.selectStart, element.selectEnd);
                } else {
                    element.selectEnd = target;
                    element.selecting = true;
                    removeSelection();
                    calculateSelection(element, element.selectStart, -1);
                }
            }
        }
    });
}
let latinRows = [keyboardRow('la', 'en', 'li', 'o', 'e', 'pi', 'ala', 'seme', functionKey('o weka', backspace)),
            keyboardRow('mi', 'sina', 'ona', 'ni', 'lon', 'tawa', 'tan', 'kepeken', 'sama'),
            multiRow([keyboardRow(functionKey('A', multiRowGoTo(2, 1)), functionKey('E', multiRowGoTo(3, 1)), functionKey('I', multiRowGoTo(4, 1)), functionKey('J', multiRowGoTo(5, 1)), functionKey('K', multiRowGoTo(6)), functionKey('L', multiRowGoTo(8)), functionKey('M', multiRowGoTo(10))),
                    keyboardRow(functionKey('N', multiRowGoTo(12, 1)), functionKey('O', multiRowGoTo(13, 1)), functionKey('P', multiRowGoTo(14)), functionKey('S', multiRowGoTo(16)), functionKey('T', multiRowGoTo(18, 1)), functionKey('U', multiRowGoTo(19, 1)), functionKey('W', multiRowGoTo(20, 1))),
                    keyboardRow('a', 'akesi', 'ala', 'alasa', 'ale', 'anpa', 'ante', 'anu', 'awen'), 
                    keyboardRow('e', 'en', 'esun'),
                    keyboardRow('ijo', 'ike', 'ilo', 'insa'),
                    keyboardRow('jaki', 'jan', 'jelo', 'jo'), 
                    keyboardRow('kala', 'kalama', 'kama', 'kasi', 'ken', 'kepeken', 'kijetesantakalu'),
                    keyboardRow('kili', 'kin', 'kiwen', 'ko', 'kon', 'kule', 'kulupu', 'kute'),
                    keyboardRow('la', 'lape', 'laso', 'lawa', 'leko', 'len', 'lete', 'li'),
                    keyboardRow('lili', 'linja', 'lipu', 'loje', 'lon', 'luka', 'lukin', 'lupa'), 
                    keyboardRow('ma', 'mama', 'mani', 'meli', 'meso', 'mi', 'mije', 'misikeke'),
                    keyboardRow('moku', 'moli', 'monsi', 'monsuta', 'mu', 'mun', 'musi', 'mute'), 
                    keyboardRow('n', 'namako', 'nanpa', 'nasa', 'nasin', 'nena', 'ni', 'nimi', 'noka'), 
                    keyboardRow('o', 'olin', 'ona', 'open'),
                    keyboardRow('pakala', 'pali', 'palisa', 'pan', 'pana', 'pi', 'pilin'),
                    keyboardRow('pimeja', 'pini', 'pipi', 'poka', 'poki', 'pona'),
                    keyboardRow('sama', 'seli', 'selo', 'seme', 'sewi', 'sijelo', 'sike', 'sin', 'sina'),
                    keyboardRow('sinpin', 'sitelen', 'soko', 'sona', 'soweli', 'suli', 'suno', 'supa', 'suwi'),
                    keyboardRow('tan', 'taso', 'tawa', 'telo', 'tenpo', 'toki', 'tomo', 'tonsi', 'tu'),
                    keyboardRow('unpa', 'uta', 'utala'),
                    keyboardRow('walo', 'wan', 'waso', 'wawa', 'weka', 'wile')], 2, false, true),
            keyboardRow(cartoucheKey(), '{', '}', 'te', 'to', ' ', ':', '.', functionKey('linja sin', newLine))];
let UCSURRows = [keyboardRow('󱤡', '󱤊', '󱤧', '󱥄', '󱤉', '󱥍', '󱤂', '󱥙', functionKey('󱥄​󱥶', backspace)),
            keyboardRow('󱤴', '󱥞', '󱥆', '󱥁', '󱤬', '󱥩', '󱥧', '󱤙', '󱥖'),
            multiRow([keyboardRow(functionKey('A', multiRowGoTo(2, 1)), functionKey('E', multiRowGoTo(3, 1)), functionKey('I', multiRowGoTo(4, 1)), functionKey('J', multiRowGoTo(5, 1)), functionKey('K', multiRowGoTo(6)), functionKey('L', multiRowGoTo(8)), functionKey('M', multiRowGoTo(10))),
                    keyboardRow(functionKey('N', multiRowGoTo(12, 1)), functionKey('O', multiRowGoTo(13, 1)), functionKey('P', multiRowGoTo(14)), functionKey('S', multiRowGoTo(16)), functionKey('T', multiRowGoTo(18, 1)), functionKey('U', multiRowGoTo(19, 1)), functionKey('W', multiRowGoTo(20, 1))),
                    keyboardRow('󱤀', '󱤁', '󱤂', '󱤃', '󱤄', '󱤅', '󱤆', '󱤇', '󱤈'), 
                    keyboardRow('󱤉', '󱤊', '󱤋'),
                    keyboardRow('󱤌', '󱤍', '󱤎', '󱤏'),
                    keyboardRow('󱤐', '󱤑', '󱤒', '󱤓'), 
                    keyboardRow('󱤔', '󱤕', '󱤖', '󱤗', '󱤘', '󱤙', '󱦀'),
                    keyboardRow('󱤚', '󱥹', '󱤛', '󱤜', '󱤝', '󱤞', '󱤟', '󱤠'),
                    keyboardRow('󱤡', '󱤢', '󱤣', '󱤤', '󱥼', '󱤥', '󱤦', '󱤧'),
                    keyboardRow('󱤨', '󱤩', '󱤪', '󱤫', '󱤬', '󱤭', '󱤮', '󱤯'), 
                    keyboardRow('󱤰', '󱤱', '󱤲', '󱤳', '󱦂', '󱤴', '󱤵', '󱦇'),
                    keyboardRow('󱤶', '󱤷', '󱤸', '󱥽', '󱤹', '󱤺', '󱤻', '󱤼'), 
                    keyboardRow('󱦆', '󱥸', '󱤽', '󱤾', '󱤿', '󱥀', '󱥁', '󱥂', '󱥃'), 
                    keyboardRow('󱥄', '󱥅', '󱥆', '󱥇'),
                    keyboardRow('󱥈', '󱥉', '󱥊', '󱥋', '󱥌', '󱥍', '󱥎'),
                    keyboardRow('󱥏', '󱥐', '󱥑', '󱥒', '󱥓', '󱥔'),
                    keyboardRow('󱥖', '󱥗', '󱥘', '󱥙', '󱥚', '󱥛', '󱥜', '󱥝', '󱥞'),
                    keyboardRow('󱥟', '󱥠', '󱦁', '󱥡', '󱥢', '󱥣', '󱥤', '󱥥', '󱥦'),
                    keyboardRow('󱥧', '󱥨', '󱥩', '󱥪', '󱥫', '󱥬', '󱥭', '󱥾', '󱥮'),
                    keyboardRow('󱥯', '󱥰', '󱥱'),
                    keyboardRow('󱥲', '󱥳', '󱥴', '󱥵', '󱥶', '󱥷')], 2, false, true),
            keyboardRow(cartoucheKey(), '{', '}', 'te', 'to', ' ', ':', '.', functionKey('linja sin', newLine))];