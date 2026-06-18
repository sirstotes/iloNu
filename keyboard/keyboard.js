function getCursor() {
    cursor = document.getElementById('cursor');
    if(document.getElementById('cursor') == undefined) {
        cursor = document.createElement('cursor');
        cursor.id = 'cursor';
    }
    return cursor;
}
function updateCursorPosition() {
    let rect = getCursor().getBoundingClientRect();
    document.getElementById('cursor_display').style.left = rect.left;
    document.getElementById('cursor_display').style.top = rect.top + rect.height*0.25;
}
function clearSelection() {
    let selection = Array.from(document.getElementsByClassName('selected'));
    selection.forEach(e => e.classList.remove('selected'));
}
function clearCursors() {
    getCursor().remove();
    document.getElementById('cursor_display').style.left = -10;
}
function eraseSelection() {
    let selection = Array.from(document.getElementsByClassName('selected'));
    selection.forEach(e => e.remove());
}
function createWordSpan(content) {
    let span = document.createElement('nimi');
    span.innerHTML = content;
    return span;
}
let CURSOR = {BEFORE: 0, AFTER: 1, INSIDE: 2};
function curseElement(element, cursorPos) {//Puts the cursor on an element.
    if(element == undefined) {
        return false;
    }
    let cursor = getCursor();
    switch(cursorPos) {
        case CURSOR.BEFORE: element.before(cursor); break;
        case CURSOR.AFTER: element.after(cursor); break;
        case CURSOR.INSIDE: element.appendChild(cursor); break;
    }
    updateCursorPosition();
    return true;
}
function putElements(elements) {
    let lastElement;
    let selection = document.getElementsByClassName('selected');
    if(selection.length > 0) {
        const firstInSelection = selection[0];
        elements.forEach(e => firstInSelection.before(e));//Insert each new element before the selection
        eraseSelection();
        lastElement = elements[elements.length - 1];
    } else {
        Array.from(document.getElementsByTagName('cursor')).forEach(cursor => {
            lastElement = elements[elements.length - 1];
            elements.forEach(newElement => cursor.before(newElement));
        });
    }
    clearCursors();
    curseElement(lastElement, CURSOR.AFTER);
    updateCursorPosition();
    const customEvent = new CustomEvent('wordsChanged', {bubbles: true, cancelable: true});
    document.dispatchEvent(customEvent);
}
function type(word) {
    let span = createWordSpan(word);
    putElements([span]);
    const customEvent2 = new CustomEvent('wordTyped', {
        detail: {span: span},
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(customEvent2);
    return span;
}
function backspace() {
    let hasReplacedCursor = false;
    function curseReplacement(elementStart, elementEnd) {
        if(curseElement(elementStart.previousElementSibling, CURSOR.AFTER) || 
        curseElement(elementEnd.nextElementSibling, CURSOR.BEFORE) || 
        (elementStart.parentElement.tagName == 'CARTOUCHE' && curseElement(elementStart.parentElement, CURSOR.INSIDE))) {
            hasReplacedCursor = true;
        }
    }
    let textArea;
    let selection = document.getElementsByClassName('selected');
    if(selection.length > 0) {
        textArea = selection[0].parentElement;
        curseReplacement(selection[0], selection[selection.length - 1]);
        eraseSelection();
    } else {
        Array.from(document.getElementsByTagName('cursor')).forEach(cursor => {
            textArea = cursor.parentElement;
            hasReplacedCursor = true;
            if(cursor.previousElementSibling != undefined) {
                cursor.previousElementSibling.remove();
            }
        });
    }
    if(!hasReplacedCursor && textArea != undefined) {
        if(textArea.children.length == 0) {
            curseElement(textArea, CURSOR.INSIDE);
        } else {
            curseElement(textArea.children[textArea.children.length-1], CURSOR.AFTER);
        }
    }
    updateCursorPosition();
    const customEvent = new CustomEvent('wordsChanged', {bubbles: true, cancelable: true});
    document.dispatchEvent(customEvent);
}
function newLine() {//TODO: Make spaces fill entire note, to end of scroll. No more <br> tags
    let selection = document.getElementsByClassName('selected');
    if(selection.length > 0 && selection[0].parentElement.noWhitespace) {return;}
    putElements([document.createElement('br')]);
}

function createKeyButton(nimi) {
    function afterClick(button) {
        for(let m of document.getElementsByClassName('multirow')) {
            if(m.reset) {
                m.goToRow(0);
            }
        }
    }
    let button = document.createElement('button');
    button.innerHTML = '<nimi>'+nimi+'</nimi>';
    button.classList.add('key');
    button.onclick = (event) => {
        type(nimi);
        afterClick(button);
        event.stopPropagation();
    };
    return button;
}
function createFunctionButton(nimi, onclick) {
    let button = document.createElement('button');
    button.innerHTML = nimi;
    button.classList.add('key', 'function_key');
    button.onclick = onclick;
    return button;
}
function createCartoucheButton() {
    let button = document.createElement('button');
    button.innerHTML = '[]';
    button.classList.add('key', 'function_key');
    let startCartouche = function() {
        let cartouche = document.createElement('cartouche');
        putElements([cartouche]);
        clearCursors();
        curseElement(cartouche, CURSOR.INSIDE);
    };
    button.onclick = startCartouche;
    return button;
}
function createLongPressButton(defaultButton, hiddenButtons) {
    if(typeof defaultButton === 'string' || defaultButton instanceof String) {
        defaultButton = createKeyButton(defaultButton);
    }
    let div = document.createElement('div');
    div.classList.add('popup');
    for(let button of hiddenButtons) {
        if(typeof button === 'string' || button instanceof String) {
            button = createKeyButton(button);
        }
        div.append(button);
        let og = button.onclick;
        button.onclick = (event) => {
            og(event);
            div.remove();
        };
    }
    defaultButton.addEventListener('pointerdown', event => {
        defaultButton.pressTimer = setTimeout(() => {
            defaultButton.append(div);
            let br1 = defaultButton.getBoundingClientRect();
            let br2 = div.getBoundingClientRect();
            div.style.left = br1.left - br2.width/2 + br1.width/2;
            div.style.top = br1.top - br2.height - 5;
            let removeDiv = function() {
                div.remove();
                document.removeEventListener('click', removeDiv);
            }
            document.addEventListener('click', removeDiv);
        }, 800);
    });
    defaultButton.addEventListener('pointercancel', event => {
        event.preventDefault();
    });
    document.addEventListener('pointerup', event => {
        clearTimeout(defaultButton.pressTimer);
    });
    return defaultButton;
}
function keyboardRow() {
    let div = document.createElement('div');
    div.classList.add('keyrow');
    for(let arg of arguments) {
        if(arg instanceof Node) {
            div.appendChild(arg);
        } else {
            div.appendChild(createKeyButton(arg));
        }
    }
    return div;
}
function multiRow(rows, height, controls, reset) {
    function stylize(element, key, value) {
        element.style[key] = value;
        return element;
    }
    let div = document.createElement('div');
    div.classList.add('keyrow', 'multirow');
    div.style.flexGrow = 2;
    div.rows = rows;
    div.reset = reset;
    div.row = 0;
    if(controls) {
        div.appendChild(stylize(createFunctionButton('pini', () => {div.goToRow(div.row - 1)}), 'flexGrow', 0));
    }
    let mrc = document.createElement('div');
    mrc.classList.add('multirow_container');
    setKeyboard(mrc, rows.slice(0, height));
    div.appendChild(mrc);
    if(controls) {
        div.appendChild(stylize(createFunctionButton('kama', () => {div.goToRow(div.row + 1)}), 'flexGrow', 0));
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
function getMultirowAndGoTo(multiIndex, row, height) {
    return (event) => {
        let mr = document.getElementById('keyboard').getElementsByClassName('multirow')[multiIndex];
        if(mr.row == row) {
            mr.goToRow(0);
        } else {
            mr.goToRow(row, height);
        }
    }
}
function setKeyboard(keyboard, rows) {
    keyboard.innerHTML = '';
    for(let row of rows) {
        keyboard.appendChild(row);
    }
}
function setupTextarea(element, checkValidFunction) {
    element.addEventListener('pointerdown', function(event) {
        if(checkValidFunction()) {
            let hasCursorBefore = event.target.previousElementSibling != null && event.target.previousElementSibling.tagName == 'CURSOR';
            let hasCursorAfter = event.target.nextElementSibling != null && event.target.nextElementSibling.tagName == 'CURSOR';
            clearSelection();
            clearCursors();
            let target;
            if(event.target == element) {
                if(element.children.length == 0) {
                    curseElement(element, CURSOR.INSIDE);
                } else {//Find the closest 
                    let closest = element.children[element.children.length - 1];
                    let closestRect;
                    let before = false;
                    for(let child of element.children) {
                        let rect = child.getBoundingClientRect();
                        if(event.clientY >= rect.top && event.clientY <= rect.bottom) {
                            if(closestRect == undefined || Math.abs(rect.left - event.clientX) < Math.abs(closestRect.left - event.clientX)) {
                                closest = child;
                                closestRect = rect;
                                before = event.clientX < rect.left || child.tagName == 'BR';
                            }
                        }
                    }
                    curseElement(closest, before ? CURSOR.BEFORE : CURSOR.AFTER);
                }
            } else {
                target = event.target;
                let center = target.offsetWidth / 2;
                if (event.offsetX > center) {
                    if(hasCursorAfter) {
                        if(event.target.tagName == 'CARTOUCHE' && event.target.children.length == 0) {
                            curseElement(target, CURSOR.INSIDE);
                        } else {
                            target.classList.add('selected');
                        }
                    } else {
                        curseElement(target, CURSOR.AFTER);
                    }
                } else {
                    if(hasCursorBefore) {
                        if(event.target.tagName == 'CARTOUCHE' && event.target.children.length == 0) {
                            curseElement(target, CURSOR.INSIDE);
                        } else {
                            target.classList.add('selected');
                        }
                    } else {
                        curseElement(target, CURSOR.BEFORE);
                    }
                }
            }
            element.selectStart = target;
            element.canDrag = true;
        }
        element.dragStartY = event.clientY;
        element.scrollStartY = element.scrollTop;
    });
    element.addEventListener('pointerup', function(event) {
        element.canDrag = false;
    });
    element.addEventListener('pointermove', function(event) {
        function calculateSelection(parentElement, startElement, endElement) {
            let sIndex = (startElement == 0) ? 0 : Array.prototype.indexOf.call(parentElement.children, startElement);
            let eIndex = (endElement == -1) ? parentElement.children.length - 1 : Array.prototype.indexOf.call(parentElement.children, endElement);
            
            for(let i = Math.max(Math.min(sIndex, eIndex), 0); i < Math.min(Math.max(sIndex, eIndex), parentElement.children.length) + 1; i ++) {
                parentElement.children[i].classList.add('selected');
            }
        }
        if(element.selectStart == undefined) {
            element.scrollTop = element.scrollStartY + element.dragStartY - event.clientY;
        } else if(checkValidFunction()) {
            if(element.canDrag) {
                let target = event.target;
                if(target == element.selectStart) {//Update the target if you drag off of it
                    target = document.elementFromPoint(event.clientX, event.clientY);
                }
                if(target.parentElement != undefined && target.parentElement.tagName == 'CARTOUCHE' && element.selectStart.parentElement.tagName != 'CARTOUCHE') {
                    target = target.parentElement;
                }
                if(event.target == element) {
                    element.selecting = true;
                    clearSelection();
                    clearCursors();
                    if (event.clientY > element.dragStartY) {//Select to the end if you drag down
                        calculateSelection(element.selectStart.parentElement, element.selectStart, -1);
                    } else {
                        calculateSelection(element.selectStart.parentElement, 0, element.selectStart);
                    }
                } else {
                    element.selecting = true;
                    clearSelection();
                    clearCursors();
                    calculateSelection(element.selectStart.parentElement, element.selectStart, target);
                }
            }
        }
    });
    element.addEventListener('scroll', function(event) {
        updateCursorPosition();
    });
}
let UCSURRows = [keyboardRow('󱤡', '󱤧', '󱥄', '󱤉', createLongPressButton('󱥍', ['󱦓']), '󱤂', '󱤇', '󱥙', createFunctionButton('󱥄​󱥶', backspace)),//TODO: Press and hold for alt glyphs
            keyboardRow('󱤴', '󱥞', '󱥆', createLongPressButton('󱥁', ['󱦉', '󱦊', '󱦋']), '󱤬', '󱥩', '󱥧', '󱤙', '󱥖'),
            multiRow([keyboardRow(createFunctionButton('A', multiRowGoTo(2, 1)), createFunctionButton('E', multiRowGoTo(3, 1)), createFunctionButton('I', multiRowGoTo(4, 1)), createFunctionButton('J', multiRowGoTo(5, 1)), createFunctionButton('K', multiRowGoTo(6)), createFunctionButton('L', multiRowGoTo(8)), createFunctionButton('M', multiRowGoTo(10))),
                    keyboardRow(createFunctionButton('N', multiRowGoTo(12, 1)), createFunctionButton('O', multiRowGoTo(13, 1)), createFunctionButton('P', multiRowGoTo(14)), createFunctionButton('S', multiRowGoTo(16)), createFunctionButton('T', multiRowGoTo(18, 1)), createFunctionButton('U', multiRowGoTo(19, 1)), createFunctionButton('W', multiRowGoTo(20, 1))),
                    keyboardRow('󱤀', '󱤁', '󱤂', '󱤃', '󱤄', '󱤅', '󱤆', '󱤇', '󱤈'),//A
                    keyboardRow('󱤉', '󱤊', '󱤋'),//E
                    keyboardRow('󱤌', '󱤍', '󱤎', '󱤏'),//I
                    keyboardRow('󱤐', '󱤑', '󱤒', '󱤓'),//J
                    keyboardRow('󱤔', '󱤕', '󱤖', '󱤗', '󱤘', '󱤙', '󱦀', '󱤚'),//K
                    keyboardRow('󱥹', '󱤛', '󱤜', '󱤝', '󱤞', '󱤟', '󱤠', '󱦥'),//K
                    keyboardRow('󱤡', '󱤢', '󱤣', '󱤤', '󱥼', '󱤥', '󱤦', '󱤧'),//L
                    keyboardRow('󱤨', '󱤩', '󱤪', '󱤫', '󱤬', '󱤭', '󱤮', '󱤯'),//L
                    keyboardRow('󱤰', '󱤱', '󱤲', '󱤳', '󱦂', '󱤴', '󱤵', '󱦇'),//M
                    keyboardRow('󱤶', '󱤷', '󱤸', '󱥽', '󱤹', '󱤺', '󱤻', '󱤼'),//M
                    keyboardRow('󱦆', '󱥸', '󱤽', '󱤾', '󱤿', '󱥀', createLongPressButton('󱥁', ['󱦉', '󱦊', '󱦋']), '󱥂', '󱥃'),//N
                    keyboardRow('󱥄', '󱥅', '󱥆', '󱥇'),//O
                    keyboardRow('󱥈', '󱥉', '󱥊', '󱥋', '󱥌', createLongPressButton('󱥍', ['󱦓']), '󱥎'),//P
                    keyboardRow('󱥏', '󱥐', '󱥑', '󱥒', '󱥓', '󱥔'),//P
                    keyboardRow('󱥖', '󱥗', '󱥘', '󱥙', createLongPressButton('󱥚', ['󱦌']), '󱥛', '󱥜', '󱥝', '󱥞'),//S
                    keyboardRow('󱥟', '󱥠', '󱦁', '󱥡', '󱥢', '󱥣', '󱥤', '󱥥', '󱥦'),//S
                    keyboardRow('󱥧', '󱥨', '󱥩', '󱥪', '󱥫', '󱥬', '󱥭', '󱥾', '󱥮'),//T
                    keyboardRow('󱥯', '󱥰', '󱥱'),//U
                    keyboardRow('󱥲', '󱥳', '󱥴', '󱥵', '󱥶', '󱥷'),//W
                    keyboardRow('{', '}', '(', ')', '[', ']'),
                    keyboardRow('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')], 2, false, true),
            keyboardRow(createCartoucheButton(), createFunctionButton('󱤆', getMultirowAndGoTo(0, 21, 2)), 'te', 'to', ' ', ':', '.', createFunctionButton('linja sin', newLine))];