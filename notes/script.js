function switchTab(tab) {
    let currentTab = document.getElementById('current_tab');
    if(currentTab) {
        removeCursor();
        removeSelection();
        currentTab.savedData = document.getElementById('textarea').innerHTML;
        currentTab.savedFont = document.getElementById('textarea').style.fontFamily;
        currentTab.id = '';
        currentTab.getElementsByClassName('tab_erase')[0].remove();
    }
    document.getElementById('textarea').innerHTML = tab.savedData;
    document.getElementById('textarea').style.fontFamily = tab.savedFont || 'inherit';
    tab.id = 'current_tab';
    let close = document.createElement('button');
    close.innerHTML = 'weka';
    close.classList.add('tab_erase');
    close.style.fontSize = '20px';
    close.addEventListener('click', function(event) {
        removeTab(tab);
    });
    tab.appendChild(close);
    moveCursorInto(document.getElementById('textarea'));
}
function tab(innerHTML) {
    let tab = document.createElement('div');
    tab.classList.add('tab');
    let name = document.createElement('button');
    name.innerHTML = innerHTML;
    name.classList.add('tab_name');
    name.addEventListener('click', function(event) {
        if(name.parentElement.id == 'current_tab') {
            moveCursorInto(name);
        } else {
            switchTab(tab);
        }
    });
    setupTextarea(name, () => {tab.id == 'current_tab'});
    tab.appendChild(name);
    tab.savedData = '';
    return tab;
}
function newTab() {
    let button = tab('<span class="nimi">lipu </span>');
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
    //TODO: add confirmation popup!
    if(tab.id == 'current_tab') {
        document.getElementById('textarea').innerHTML = '';
    }
    if(tab.previousElementSibling && tab.previousElementSibling.savedData) {
        switchTab(tab.previousElementSibling);
    } else if (tab.nextElementSibling && tab.nextElementSibling.savedData) {
        switchTab(tab.nextElementSibling);
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
    removeCursor();
    removeSelection();
    for(let tab of document.getElementsByClassName('tab')) {
        tab.getElementsByClassName('tab_name')[0].style.fontStyle = '';
        if(tab.hasOwnProperty('dbID')) {//Update the database entry if it has an associated ID
            const request = store.get(tab.dbID);
            request.onsuccess = (event) => {
                const data = event.target.result;
                data.title = tab.getElementsByTagName('button')[0].innerHTML;
                if(tab.id == 'current_tab') {
                    tab.savedData = document.getElementById('textarea').innerHTML;
                    tab.savedFont = document.getElementById('textarea').style.fontFamily;
                }
                data.data = tab.savedData;
                data.font = tab.savedFont;
                const requestUpdate = store.put(data, tab.dbID);
            }
        } else {//Otherwise create a new entry
            if(tab.id == 'current_tab') {
                tab.savedData = document.getElementById('textarea').innerHTML;
                    tab.savedFont = document.getElementById('textarea').style.fontFamily;
            }
            if(tab.savedData.length > 0) {//Only save if it has been changed
                console.log("Adding new data");
                store.add({title: tab.getElementsByTagName('button')[0].innerHTML, data: tab.savedData, font: tab.savedFont});
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
}
function getWebsiteFont() {
    return document.documentElement.style.fontFamily;
}
function setWebsiteFont(font) {
    document.documentElement.style.fontFamily = font;
}
function getDarkMode() {
    return document.documentElement.style.colorScheme == 'dark';
}
function setDarkMode(bool) {
    document.documentElement.style.colorScheme = bool?'dark':'light';
}
function toggleDarkMode() {
    setDarkMode(!getDarkMode());
}
function getInputColor() {
    return document.documentElement.style.getPropertyValue("--input-text-color");
}
function setInputColor(color) {
    document.documentElement.style.setProperty("--input-text-color", color);
    document.getElementById('input-color-preview').style.color = color;
    for(let e of document.getElementsByClassName('selected')) {
        e.style.color = color;
    }
}
function getInputHighlight() {
    return document.documentElement.style.getPropertyValue("--input-highlight-color");
}
function setInputHighlight(color) {
    document.documentElement.style.setProperty("--input-highlight-color", color);
    document.getElementById('input-highlight-preview').style.backgroundColor = color;
    for(let e of document.getElementsByClassName('selected')) {
        e.style.backgroundColor = color;
    }
}
function copySelection() {
    if(document.getElementsByClassName('selected').length > 0) {
        navigator.clipboard.writeText(Array.from(document.getElementsByClassName('selected')).reduce((t, e) => {
            let c = e.cloneNode(true);
            c.classList.remove('selected');
            return t + c.outerHTML;
        }, ''));
    }
}
function cutSelection() {
    copySelection();
    let selection = Array.from(document.getElementsByClassName('selected'));
    if(selection.length > 0) {
        moveCursorAfter(selection[0]);
        for(let i = 0; i < selection.length; i ++) {
            selection[i].remove();
        }
    }
}
async function pasteFromClipboard() {
    let text = await navigator.clipboard.readText();
    let div = document.createElement('div');
    div.innerHTML = text;
    let elements = Array.from(div.children);

    let selection = Array.from(document.getElementsByClassName('selected'));
    if(selection.length > 0) {
        moveCursorAfter(selection[0]);
        for(let i = 0; i < selection.length; i ++) {
            selection[i].remove();
        }
    }
    for(let element of elements) {
        getCursor().before(element);
    }
}

document.addEventListener('wordTyped', (event) => {
    event.detail.span.style.color = getInputColor();
    event.detail.span.style.backgroundColor = getInputHighlight();
});

document.addEventListener('wordsChanged', (event) => {
    document.getElementById('current_tab').getElementsByClassName('tab_name')[0].style.fontStyle = 'italic';
});