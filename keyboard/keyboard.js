function clearSelection() {
    let selection = Array.from(document.getElementsByClassName('selected'));
    selection.forEach(e => e.classList.remove('selected'));
}
function clearCursors() {
    Array.from(document.getElementsByClassName('cursor_before')).forEach(e => e.classList.remove('cursor_before'));
    Array.from(document.getElementsByClassName('cursor_after')).forEach(e => e.classList.remove('cursor_after'));
    Array.from(document.getElementsByClassName('cursor_inside')).forEach(e => e.classList.remove('cursor_inside'));
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
function putElements(elements) {
    let lastElement;
    let selection = document.getElementsByClassName('selected');
    if(selection.length > 0) {
        const firstInSelection = selection[0];
        elements.forEach(e => firstInSelection.before(e));//Insert each new element before the selection
        eraseSelection();
        lastElement = elements[elements.length - 1];
    } else {
        Array.from(document.getElementsByClassName('cursor_before')).forEach(cursor => {
            lastElement = elements[elements.length - 1];
            elements.forEach(newElement => cursor.before(newElement));
        });
        Array.from(document.getElementsByClassName('cursor_after')).forEach(cursor => {
            lastElement = elements[elements.length - 1];
            for(let i = elements.length - 1; i > -1; i --) {
                cursor.after(elements[i]);
            }
        });
        Array.from(document.getElementsByClassName('cursor_inside')).forEach(cursor => {
            lastElement = elements[elements.length - 1];
            elements.forEach(newElement => cursor.appendChild(newElement));
        });
    }
    clearCursors();
    if(lastElement != undefined) {
        lastElement.classList.add('cursor_after');
    }
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
    let textArea;
    let selection = document.getElementsByClassName('selected');
    if(selection.length > 0) {
        textArea = selection[0].parentElement;
        if(selection[0].previousElementSibling != undefined) {
            hasReplacedCursor = true;
            selection[0].previousElementSibling.classList.add('cursor_after');
        } else if (selection[selection.length - 1].nextElementSibling != undefined) {
            hasReplacedCursor = true;
            selection[selection.length - 1].nextElementSibling.classList.add('cursor_before');
        } else if (selection[0].parentElement.tagName == 'CARTOUCHE') {
            hasReplacedCursor = true;
            selection[0].parentElement.classList.add('cursor_inside');
        }
        eraseSelection();
    } else {
        Array.from(document.getElementsByClassName('cursor_after')).forEach(cursor => {
            textArea = cursor.parentElement;
            if(cursor.previousElementSibling != undefined) {
                hasReplacedCursor = true;
                cursor.previousElementSibling.classList.add('cursor_after');
            } else if (cursor.nextElementSibling != undefined) {
                hasReplacedCursor = true;
                cursor.nextElementSibling.classList.add('cursor_before');
            } else if (cursor.parentElement.tagName == 'CARTOUCHE') {
                hasReplacedCursor = true;
                cursor.parentElement.classList.add('cursor_inside');
            }
            cursor.remove();
        });
        Array.from(document.getElementsByClassName('cursor_before')).forEach(cursor => {
            textArea = cursor.parentElement;
            hasReplacedCursor = true;
            if(cursor.previousElementSibling != undefined) {
                cursor.previousElementSibling.remove();
            }
        });
        Array.from(document.getElementsByClassName('cursor_inside')).forEach(cursor => {
            textArea = cursor.parentElement;
            if(cursor.previousElementSibling != undefined) {
                hasReplacedCursor = true;
                cursor.previousElementSibling.classList.add('cursor_after');
            } else if (cursor.nextElementSibling != undefined) {
                hasReplacedCursor = true;
                cursor.nextElementSibling.classList.add('cursor_before');
            } else if (cursor.parentElement.tagName == 'CARTOUCHE') {
                hasReplacedCursor = true;
                cursor.parentElement.classList.add('cursor_inside');
            }
            cursor.remove();
        });
    }
    if(!hasReplacedCursor && textArea != undefined) {
        if(textArea.children.length == 0) {
            let newSpan = createWordSpan(' ');
            newSpan.classList.add('cursor_before');
            textArea.appendChild(newSpan);
        } else {
            textArea.children[textArea.children.length-1].classList.add('cursor_after');
        }
    }
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
        cartouche.classList.add('cursor_inside');
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
            let hasCursorBefore = event.target.classList.contains('cursor_before');
            let hasCursorAfter = event.target.classList.contains('cursor_after');
            clearSelection();
            clearCursors();
            let target;
            if(event.target == element) {
                if(element.children.length == 0) {
                    target = createWordSpan(' ');
                    target.classList.add('cursor_before');
                    element.appendChild(target);
                } else {
                    target = element.children[element.children.length - 1];
                    target.classList.add('cursor_after');
                }
            } else {
                target = event.target;
                let center = target.offsetWidth / 2;
                if (event.offsetX > center) {
                    if(hasCursorAfter) {
                        if(event.target.tagName == 'CARTOUCHE' && event.target.children.length == 0) {
                            target.classList.add('cursor_inside');
                        } else {
                            target.classList.add('selected');
                        }
                    } else {
                        target.classList.add('cursor_after');
                    }
                } else {
                    if(hasCursorBefore) {
                        if(event.target.tagName == 'CARTOUCHE' && event.target.children.length == 0) {
                            target.classList.add('cursor_inside');
                        } else {
                            target.classList.add('selected');
                        }
                    } else {
                        target.classList.add('cursor_before');
                    }
                }
            }
            element.selectStart = target;
            element.dragStartY = event.clientY;
            element.canDrag = true;
        }
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
        if(checkValidFunction()) {
            if(element.canDrag) {
                let target = event.target;
                if(target == element.selectStart) {//Update the target if you drag off of it
                    target = document.elementFromPoint(event.clientX, event.clientY);
                }
                if(target.parentElement.tagName == 'CARTOUCHE' && element.selectStart.parentElement.tagName != 'CARTOUCHE') {
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
}
let UCSURRows = [keyboardRow('󱤡', '󱤊', '󱤧', '󱥄', '󱤉', '󱥍', '󱤂', '󱥙', createFunctionButton('󱥄​󱥶', backspace)),//TODO: Press and hold for alt glyphs
            keyboardRow('󱤴', '󱥞', '󱥆', '󱥁', '󱤬', '󱥩', '󱥧', '󱤙', '󱥖'),
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
                    keyboardRow('󱦆', '󱥸', '󱤽', '󱤾', '󱤿', '󱥀', '󱥁', '󱥂', '󱥃'),//N
                    keyboardRow('󱥄', '󱥅', '󱥆', '󱥇'),//O
                    keyboardRow('󱥈', '󱥉', '󱥊', '󱥋', '󱥌', '󱥍', '󱥎'),//P
                    keyboardRow('󱥏', '󱥐', '󱥑', '󱥒', '󱥓', '󱥔'),//P
                    keyboardRow('󱥖', '󱥗', '󱥘', '󱥙', '󱥚', '󱥛', '󱥜', '󱥝', '󱥞'),//S
                    keyboardRow('󱥟', '󱥠', '󱦁', '󱥡', '󱥢', '󱥣', '󱥤', '󱥥', '󱥦'),//S
                    keyboardRow('󱥧', '󱥨', '󱥩', '󱥪', '󱥫', '󱥬', '󱥭', '󱥾', '󱥮'),//T
                    keyboardRow('󱥯', '󱥰', '󱥱'),//U
                    keyboardRow('󱥲', '󱥳', '󱥴', '󱥵', '󱥶', '󱥷'),//W
                    keyboardRow('{', '}', '(', ')', '[', ']'),
                    keyboardRow('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')], 2, false, true),
            keyboardRow(createCartoucheButton(), createFunctionButton('󱤆', getMultirowAndGoTo(0, 21, 2)), 'te', 'to', ' ', '󱤀', ':', '.', createFunctionButton('linja sin', newLine))];