function switchTab(tab) {
    let currentTab = document.getElementById('current_tab');
    if(currentTab) {
        removeCursor();
        currentTab.savedData = document.getElementById('textarea').innerHTML;
        currentTab.id = '';
    }
    document.getElementById('textarea').innerHTML = tab.savedData;
    tab.id = 'current_tab';
    moveCursorInto(document.getElementById('textarea'));
}
function tab(innerHTML) {
    let tab = document.createElement('div');
    tab.classList.add('tab');
    let name = document.createElement('button');
    name.innerHTML = innerHTML;
    name.addEventListener('click', function(event) {
        if(name.parentElement.id == 'current_tab') {
            moveCursorInto(name);
        } else {
            switchTab(tab);
        }
    });
    tab.appendChild(name);
    let close = document.createElement('button');
    close.innerHTML = 'weka';
    close.style.fontSize = '20px';
    close.addEventListener('click', function(event) {
        removeTab(tab);
    });
    tab.appendChild(close);
    tab.savedData = '';
    return tab;
}
function newTab() {
    let button = tab('<span>lipu </span>');
    document.getElementById('new').before(button);
    switchTab(button);
}
function loadTab(title, id, data, db) {
    let button = tab(title);
    button.dbID = id;
    button.db = db;
    button.savedData = data;
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
            tab = loadTab(cursor.value.title, cursor.key, cursor.value.data, db);
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
    removeCursor();
    for(let tab of document.getElementsByClassName('tab')) {
        if(tab.hasOwnProperty('dbID')) {//Update the database entry if it has an associated ID
            const request = store.get(tab.dbID);
            request.onsuccess = (event) => {
                console.log("Updating entry");
                const data = event.target.result;
                data.title = tab.getElementsByTagName('button')[0].innerHTML;
                if(tab.id == 'current_tab') {
                    tab.savedData = document.getElementById('textarea').innerHTML;
                }
                data.data = tab.savedData;
                const requestUpdate = store.put(data, tab.dbID);
            }
        } else {//Otherwise create a new entry
            console.log("New entry");
            if(tab.id == 'current_tab') {
                tab.savedData = document.getElementById('textarea').innerHTML;
            }
            if(tab.savedData.length > 0) {//Only save if it has been changed
                console.log("Adding new data");
                store.add({title: tab.getElementsByTagName('button')[0].innerHTML, data: tab.savedData});
            }
        }
    }
}