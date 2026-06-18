function switchTab(tab) {
    if(tab.parentElement == undefined) {return}
    let currentTab = document.getElementById('current_tab');
    if(currentTab) {
        clearSelection();
        currentTab.savedData = document.getElementById('textarea').innerHTML;
        currentTab.savedFont = document.getElementById('textarea').style.fontFamily;
        currentTab.id = '';
        currentTab.getElementsByClassName('tab_erase')[0].remove();
    }
    document.getElementById('textarea').innerHTML = tab.savedData;
    document.getElementById('textarea').style.fontFamily = tab.savedFont || 'inherit';
    let before = true;
    let after = false;
    let index = tab.parentElement.children.length;
    Array.from(tab.parentElement.children).forEach(child => {
        index -= 1;
        child.classList.remove('after_current_tab');
        child.classList.remove('before_current_tab');
        child.style.zIndex = '';
        if(child == tab) {
            before = false;
            child.style.zIndex = index;
        } else if (before) {
            child.classList.add('before_current_tab');
        } else {
            child.classList.add('after_current_tab');
            if(child.classList.contains('tab')) {
                child.style.zIndex = index;
            }
        }
    });
    tab.id = 'current_tab';
    let weka = document.createElement('button');
    weka.innerHTML = 'weka';
    weka.classList.add('tab_erase');
    weka.style.fontSize = '20px';
    weka.readyToDelete = false;
    weka.addEventListener('click', function(event) {
        if(weka.readyToDelete) {//Require two clicks to prevent accidental deletion
            removeTab(tab);
        } else {
            weka.readyToDelete = true;
        }
    });
    tab.insertBefore(weka, tab.children[0]);
}
function tab(innerHTML) {
    let tab = document.createElement('div');
    tab.addEventListener('click', function(event) {
        if(tab.id != 'current_tab') {
            switchTab(tab);
        }
    });
    tab.classList.add('tab');
    let name = document.createElement('div');
    name.innerHTML = innerHTML;
    name.classList.add('tab_name');
    setupTextarea(name, () => tab.id == 'current_tab');
    name.noWhitespace = true;
    tab.appendChild(name);
    tab.savedData = '';
    return tab;
}
function newTab() {
    let button = tab(createWordSpan('lipu').outerHTML);
    document.getElementById('new').before(button);
    switchTab(button);
}
function loadTab(title, id, data, font, db) {
    let button = tab(title);
    button.dbID = id;
    button.db = db;
    button.savedData = data;
    button.savedFont = font;
    document.getElementById('new').before(button);
    return button;
}
function removeTab(tab) {
    if(tab.id == 'current_tab') {
        document.getElementById('textarea').innerHTML = '';
    }
    if(tab.previousElementSibling.tagName == 'DIV') {
        switchTab(tab.previousElementSibling);
    } else if (tab.nextElementSibling.tagName == 'DIV') {
        switchTab(tab.nextElementSibling)
    }
    tab.remove();
    if(tab.hasOwnProperty('dbID')) {
        tab.db.transaction('files', 'readwrite').objectStore('files').delete(tab.dbID);
    }
}
function loadTabs(store, db) {
    for(let tab of document.getElementsByClassName('tab')) {
        tab.remove();
    }
    let tab;
    store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            tab = loadTab(cursor.value.title, cursor.key, cursor.value.data, cursor.value.font, db);
            cursor.continue();
        } else {
            if(tab == undefined) {
                newTab();
            } else {
                switchTab(tab);
            }
        }
    };
}
function saveTabs(store) {
    console.log('Saving all files to database.');
    clearSelection();
    clearCursors();
    let textAreaInnerHTML = document.getElementById('textarea').innerHTML;
    for(let tab of document.getElementsByClassName('tab')) {
        tab.getElementsByClassName('tab_name')[0].style.fontStyle = '';
        if(tab.hasOwnProperty('dbID')) {//Update the database entry if it has an associated ID
            const request = store.get(tab.dbID);
            request.onsuccess = (event) => {
                const data = event.target.result;
                data.title = tab.getElementsByClassName('tab_name')[0].innerHTML;
                if(tab.id == 'current_tab') {
                    tab.savedData = textAreaInnerHTML;
                    tab.savedFont = document.getElementById('textarea').style.fontFamily;
                }
                data.data = tab.savedData;
                data.font = tab.savedFont;
                const requestUpdate = store.put(data, tab.dbID);
            }
        } else {//Otherwise create a new entry
            if(tab.id == 'current_tab') {
                tab.savedData = textAreaInnerHTML;
                tab.savedFont = document.getElementById('textarea').style.fontFamily;
            }
            if(tab.savedData.length > 0) {//Only save if it has been changed
                console.log("Adding new data");
                const addReq = store.add({title: tab.getElementsByClassName('tab_name')[0].innerHTML, data: tab.savedData, font: tab.savedFont});
                addReq.onsuccess = (e) => {tab.dbID = e.target.result;}
            }
        }
    }
}
function getHidden(element) {
    return element.style.display == 'none';
}
function setHidden(element, hidden) {
    element.style.display = hidden ? 'none' : '';
}
function toggleHidden(element) {
    setHidden(element, !getHidden(element));
}
function setFontSize(size) {
    localStorage.setItem('fontSize', size);
    updateCursorPosition();
    document.documentElement.style.setProperty("--font-size", String(size)+"px");
}
function getFontSize() {
    return parseInt(document.documentElement.style.getPropertyValue('--font-size'));
}
function increaseFontSize() {
    setFontSize(getFontSize() + 1);
}
function decreaseFontSize() {
    setFontSize(getFontSize() - 1);
}
function setDocumentFont(font) {
    document.getElementById('current_tab').savedFont = font;
    document.getElementById('textarea').style.fontFamily = font;
    updateCursorPosition();
}
function getWebsiteFont() {
    return document.documentElement.style.fontFamily;
}
function setWebsiteFont(font) {
    localStorage.setItem('siteFont', font);
    document.getElementById('fontSelect').value = font;
    document.documentElement.style.fontFamily = font;
    updateCursorPosition();
}
function getDarkMode() {
    return document.documentElement.style.colorScheme == 'dark';
}
function setDarkMode(bool) {
    localStorage.setItem('darkMode', bool);
    document.documentElement.style.colorScheme = bool?'dark':'light';
}
function toggleDarkMode() {
    setDarkMode(!getDarkMode());
}
function getInputStyle(property) {//TODO: Refactor cursor style system
    return document.documentElement.style.getPropertyValue("--"+property);
}
function setInputStyle(property, value) {
    function setStyle(elements, property, value) {
        for(let e of elements) {
            e.style.setProperty(property, value);
            setStyle(e.children, property, value);
        }
    }
    document.documentElement.style.setProperty("--"+property, value);
    setStyle(document.getElementsByClassName('selected'), property, value);
}
function toggleInputStyle(property, onValue, offValue) {
    if(document.documentElement.style.getPropertyValue("--"+property) == onValue) {
        setInputStyle(property, offValue);
    } else {
        setInputStyle(property, onValue);
    }
}
function getInputColor() {
    return document.documentElement.style.getPropertyValue("--input-text-color");
}
function setInputColor(color) {
    document.documentElement.style.setProperty("--input-text-color", color);
    document.getElementById('input_color_preview').style.color = color;
    for(let e of document.getElementsByClassName('selected')) {
        e.style.color = color;
    }
}
function getInputHighlight() {
    return document.documentElement.style.getPropertyValue("--input-highlight-color");
}
function setInputHighlight(color) {
    document.documentElement.style.setProperty("--input-highlight-color", color);
    document.getElementById('input_highlight_preview').style.backgroundColor = color;
    for(let e of document.getElementsByClassName('selected')) {
        e.style.backgroundColor = color;
    }
}
function storeSelection() {
    let selection = Array.from(document.getElementsByClassName('selected'));//Copy selection and cursors before they get removed
    let cursorParent = getCursor().parentElement;
    let cursorIndex = Array.from(cursorParent.children).indexOf(getCursor());
    return {
        selection: selection,
        cursorParent: cursorParent,
        cursorIndex: cursorIndex
    };
}
function unpackStoredSelection(storedSelection) {
    storedSelection.selection.forEach(e => e.classList.add('selected'));//Re-add selection and cursors.
    storedSelection.cursorParent.insertBefore(getCursor(), storedSelection.cursorParent.children[storedSelection.cursorIndex]);
}
async function copySelection() {
    function getClone (node) {
        let tag = (node.tagName == 'NIMI') ? 'i' : (node.tagName == 'CARTOUCHE') ? 'b' : node.tagName;
        const clone = document.createElement(tag);
        for (const attr of node.attributes) {
            if(attr.name != 'class') {
                clone.setAttributeNS(null, attr.name, attr.value);
            }
        }
        for(let child of node.childNodes) {
            if(child instanceof Element) {
                clone.appendChild(getClone(child));
            } else {
                clone.appendChild(child.cloneNode());
            }
        }
        return clone;
    }
    function innerText(element) {
        let text = '';
        for(let child of element.children) {
            text += innerText(child);
        }
        if(element.tagName == 'CARTOUCHE') {
            text = '󱦐' + text + '󱦑';
        } else {
            text += element.innerText;
        }
        return text;
    }
    let s = storeSelection();
    if(document.getElementsByClassName('selected').length > 0) {
        let selection = Array.from(document.getElementsByClassName('selected'));
        let html = selection.reduce((t, e) => {
            return t + getClone(e, 'i').outerHTML;
        }, '');
        console.log(html)
        const clipboardItem = new ClipboardItem({
            "text/plain": new Blob([selection.reduce((t, e) => t + innerText(e), '')], { type: "text/plain" }),
            "text/html": new Blob([html], { type: "text/html" })
        });
        await navigator.clipboard.write([clipboardItem]);
    } else {
        const clipboardItem = new ClipboardItem({
            "text/plain": new Blob([document.getElementById('textarea').innerText], { type: "text/plain" }),
            "text/html": new Blob([getClone(document.getElementById('textarea')).innerHTML], { type: "text/html" })
        });
        await navigator.clipboard.write([clipboardItem]);
    }
    unpackStoredSelection(s);
}
function cutSelection() {
    copySelection();
    if(document.getElementsByClassName('selected').length > 0) {
        let selection = Array.from(document.getElementsByClassName('selected'));
        if(selection[0].previousElementSibling != undefined) {
            selection[0].previousElementSibling.classList.add('cursor_after');
        } else if (selection[selection.length - 1].nextElementSibling != undefined) {
            selection[selection.length - 1].nextElementSibling.classList.add('cursor_before');
        } else if (selection[0].parentElement.tagName == 'CARTOUCHE') {
            selection[0].parentElement.classList.add('cursor_inside');
        }
        eraseSelection();
    } else {
        let element = document.getElementById('textarea')
        element.innerHTML = '';
        let span = createWordSpan(' ');
        span.classList.add('cursor_before');
        element.appendChild(span);
    }
}
async function pasteFromClipboard() {
    function getInverseClone (node) {
        let tag = (node.tagName == 'I') ? 'nimi' : (node.tagName == 'B') ? 'cartouche' : node.tagName;
        const clone = document.createElement(tag);
        for (const attr of node.attributes) {
            if(attr.name != 'class') {
                clone.setAttributeNS(null, attr.name, attr.value);
            }
        }
        for(let child of node.childNodes) {
            if(child instanceof Element) {
                clone.appendChild(getInverseClone(child));
            } else {
                clone.appendChild(child.cloneNode());
            }
        }
        return clone;
    }
    let items = await navigator.clipboard.read();
    if(items[0].types.includes('text/html')) {
        let text = await (await items[0].getType('text/html')).text();
        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        putElements(Array.from(tempDiv.children).map(c => getInverseClone(c)));
    } else if (items[0].types.includes('text/plain')) {
        let text = await (await items[0].getType('text/plain')).text();
        let word = '';
        for(let char of text) {
            console.log(char)
            console.log(/^[a-zA-Z]*$/.test(char))
            if(/^[a-zA-Z]*$/.test(char)) {
                word += char;
            } else {
                if(word.length > 0) {
                    type(word);
                    word = '';
                }
                type(char);
            }
        }
        if(word.length > 0) {
            type(word);
            word = '';
        }
    }
}

document.addEventListener('wordTyped', (event) => {
    event.detail.span.style.color = getInputColor();
    event.detail.span.style.backgroundColor = getInputHighlight();
});

document.addEventListener('wordsChanged', (event) => {
    document.getElementById('current_tab').getElementsByClassName('tab_name')[0].style.fontStyle = 'italic';
});