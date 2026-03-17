let state = {
    baseSkinUrl: null,
    modelType: 'steve',
    equippedItems: [],
    theme: localStorage.getItem('theme') || 'system',
    currentAnim: 'idle'
};

let mainViewer = null;
let itemViewers = [];

let currentRenderId = 0;
let textureUpdateId = 0;
let searchTimeout = null;

const initModal = document.getElementById('initModal');
const appContainer = document.getElementById('appContainer');
const mergeCanvas = document.getElementById('mergeCanvas');
const canvas2d = document.getElementById('canvas2d');
const mergeCtx = mergeCanvas.getContext('2d', { willReadFrequently: true });
const ctx2d = canvas2d.getContext('2d', { willReadFrequently: true });

document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    document.getElementById('btnFetchUser').addEventListener('click', fetchSkinFromUsername);
    document.getElementById('skinFileInput').addEventListener('change', loadSkinFromFile);
    document.getElementById('btnResetSkin').addEventListener('click', resetApp);
    document.getElementById('btnClearClothes').addEventListener('click', clearAllClothes);

    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => filterWardrobe(e), 300);
    });

    document.getElementById('btnDownloadCombined').addEventListener('click', downloadCombinedSkin);
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);

    const sidebar = document.getElementById('categorySidebar');
    const mainSearch = document.getElementById('mainSearchBar');

    document.getElementById('btnToggleSidebar').addEventListener('click', () => {
        sidebar.classList.add('open');
        mainSearch.classList.add('search-hidden'); 
    });

    document.getElementById('btnCloseSidebar').addEventListener('click', () => {
        sidebar.classList.remove('open');
        mainSearch.classList.remove('search-hidden'); 
    });

    document.getElementById('searchCategoryInput').addEventListener('input', filterCategories);

    document.querySelectorAll('.anim-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.anim-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            changeAnimation(e.currentTarget.dataset.anim);
        });
    });
});

function initTheme() { applyTheme(state.theme); }

function toggleTheme() {
    const themes = ['system', 'light', 'dark'];
    let currentIndex = themes.indexOf(state.theme);
    state.theme = themes[(currentIndex + 1) % themes.length];
    localStorage.setItem('theme', state.theme);
    applyTheme(state.theme);
}

function applyTheme(themeName) {
    const label = document.getElementById('themeLabel');
    const icon = document.querySelector('#themeBtn i');
    if (themeName === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        label.innerText = 'System';
        icon.className = 'fa-solid fa-desktop';
        document.querySelector(':root').style.setProperty('--panel-bg-rgb', isDark ? '30, 41, 59' : '255, 255, 255');
    } else {
        document.body.setAttribute('data-theme', themeName);
        label.innerText = themeName === 'dark' ? 'Dark' : 'Light';
        icon.className = themeName === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        document.querySelector(':root').style.setProperty('--panel-bg-rgb', themeName === 'dark' ? '30, 41, 59' : '255, 255, 255');
    }
}


async function fetchSkinFromUsername() {
    const username = document.getElementById('usernameInput').value.trim();
    if (!username) return;
    const errorDisplay = document.getElementById('initError');
    errorDisplay.style.color = "var(--text-color)";
    errorDisplay.innerText = "Downloading player skin…";

    try {
        const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${username}?_=${Date.now()}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        
        const skinUrl = `data:image/png;base64,${data.textures.skin.data}`;
        
        
        const img = await loadImage(skinUrl);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 64; 
        tempCanvas.height = 64;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        tempCtx.drawImage(img, 0, 0);

        
        const alpha = tempCtx.getImageData(54, 20, 1, 1).data[3];
        state.modelType = (alpha === 0) ? 'alex' : 'steve';

        
        const radioBtn = document.querySelector(`input[name="modelType"][value="${state.modelType}"]`);
        if (radioBtn) radioBtn.checked = true;

        errorDisplay.innerText = "";
        startGame(skinUrl); 

    } catch (e) {
        try {
            const skinUrl = `https://minotar.net/skin/${username}?_=${Date.now()}`;
            const img = await loadImage(skinUrl);
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 64; 
            tempCanvas.height = 64;
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            tempCtx.drawImage(img, 0, 0);
            
            const alpha = tempCtx.getImageData(54, 20, 1, 1).data[3];
            state.modelType = (alpha === 0) ? 'alex' : 'steve';

            const radioBtn = document.querySelector(`input[name="modelType"][value="${state.modelType}"]`);
            if (radioBtn) radioBtn.checked = true;

            errorDisplay.innerText = "";
            startGame(tempCanvas.toDataURL('image/png'));
        } catch (fallbackErr) {
            errorDisplay.style.color = "var(--danger-color)";
            errorDisplay.innerText = "Error: No such player found (Premium).";
        }
    }
}

function loadSkinFromFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const result = event.target.result;
        try {
            const img = await loadImage(result);
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 64; 
            tempCanvas.height = 64;
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            tempCtx.drawImage(img, 0, 0);
            
            const alpha = tempCtx.getImageData(54, 20, 1, 1).data[3];
            state.modelType = (alpha === 0) ? 'alex' : 'steve';
            
            const radioBtn = document.querySelector(`input[name="modelType"][value="${state.modelType}"]`);
            if (radioBtn) radioBtn.checked = true;
        } catch (err) {
            state.modelType = document.querySelector('input[name="modelType"]:checked').value;
        }
        startGame(result);
    };
    reader.readAsDataURL(file);
}

function startGame(skinUrl) {
    state.baseSkinUrl = skinUrl;
    initModal.classList.add('hidden');
    appContainer.style.display = 'flex';

    setTimeout(() => {
        initMainViewer();
        updateSkinTextures();
        renderWardrobe();
        renderSidebarCategories();
    }, 150);
}

function resetApp() {
    initModal.classList.remove('hidden');
    appContainer.style.display = 'none';
    state.equippedItems = [];
    document.getElementById('skinFileInput').value = "";
    document.getElementById('usernameInput').value = "";
    document.getElementById('initError').innerText = "";

    currentRenderId++;
    textureUpdateId++;
    itemViewers.forEach(v => v.dispose());
    itemViewers = [];
    if(mainViewer) { mainViewer.dispose(); mainViewer = null; }
}

function clearAllClothes() {
    state.equippedItems = [];
    updateSkinTextures();
    updateCardStylesDOM();
}

function initMainViewer() {
    const container = document.getElementById('main3dViewer');
    container.innerHTML = '';

    const w = container.clientWidth || 300;
    const h = container.clientHeight || 300;

    mainViewer = new skinview3d.SkinViewer({
        width: w, height: h,
        skin: state.baseSkinUrl,
        model: state.modelType === 'alex' ? 'slim' : 'default'
    });

    mainViewer.autoRotate = false;
    changeAnimation(state.currentAnim);
    container.appendChild(mainViewer.canvas);
}

function changeAnimation(animType) {
    if(!mainViewer) return;
    state.currentAnim = animType;
    mainViewer.animation = null;
    if (animType === 'walk') mainViewer.animation = new skinview3d.WalkingAnimation();
    else if (animType === 'run') mainViewer.animation = new skinview3d.RunningAnimation();
    else mainViewer.animation = new skinview3d.IdleAnimation();
}

async function updateSkinTextures() {
    const thisUpdateId = ++textureUpdateId;
    mergeCtx.clearRect(0, 0, 64, 64);

    try {
        const baseImg = await loadImage(state.baseSkinUrl);
        if (thisUpdateId !== textureUpdateId) return;
        mergeCtx.drawImage(baseImg, 0, 0);
        
        for (const item of state.equippedItems) {
            try {
                const itemImg = await loadImage(item.textureUrl);
                if (thisUpdateId !== textureUpdateId) return;
                mergeCtx.drawImage(itemImg, 0, 0);
            } catch(e) { }
        }
        
        const finalDataUrl = mergeCanvas.toDataURL('image/png');
        if (mainViewer && thisUpdateId === textureUpdateId) {
            mainViewer.loadSkin(finalDataUrl);
        }
        
        if (thisUpdateId === textureUpdateId) {
            ctx2d.clearRect(0, 0, 64, 64);
            ctx2d.drawImage(mergeCanvas, 0, 0);
            renderEquippedList();
        }
    } catch(e) { console.error("Clothing overlay error", e); }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function renderWardrobe(filterText = "") {
    const thisRenderId = ++currentRenderId; 
    const container = document.getElementById('wardrobeContent');
    container.innerHTML = '';

    itemViewers.forEach(v => {
        if(v.canvas && v.canvas.parentNode) v.canvas.parentNode.removeChild(v.canvas);
        v.dispose();
    });
    itemViewers = [];

    mySections.forEach(section => {
        const sectionItems = myItems.filter(item => {
            if (item.sectionId !== section.id) return false;
            
            const itemType = (item.type || 'all').toLowerCase();
            if (itemType !== 'all' && itemType !== state.modelType) return false;
            
            const searchStr = filterText.toLowerCase();
            if (searchStr) {
                return item.name.toLowerCase().includes(searchStr) || 
                       (item.description && item.description.toLowerCase().includes(searchStr)) || 
                       item.author.name.toLowerCase().includes(searchStr) ||
                       section.name.toLowerCase().includes(searchStr);
            }
            return true;
        });

        if (sectionItems.length === 0) return;

        const secDiv = document.createElement('div');
        secDiv.className = 'section-container';
        secDiv.id = `sec-${section.id}`;
        secDiv.innerHTML = `<h3 class="section-title">${section.name}</h3>`;
        
        const grid = document.createElement('div');
        grid.className = 'items-grid';

        sectionItems.forEach((item) => {
            const isEquipped = state.equippedItems.some(eq => eq.id === item.id);
            const card = document.createElement('div');
            card.className = `item-card ${isEquipped ? 'equipped' : ''}`;
            card.dataset.id = item.id;
            
            card.onclick = () => toggleEquip(item, section);

            const authorHtml = (item.author.url && item.author.url.length > 2)
                ? `<a href="${item.author.url}" target="_blank" onclick="event.stopPropagation()">${item.author.name}</a>` 
                : `<span>${item.author.name}</span>`;

            card.innerHTML = `
                <div class="item-3d-preview" id="preview-${item.id}"></div>
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p class="desc" title="${item.description || ''}">${item.description || ''}</p>
                    <div class="author">Author: ${authorHtml}</div>
                </div>
                <button class="btn btn-small secondary btn-download-raw" onclick="event.stopPropagation(); downloadUrlAsFile('${item.textureUrl}', '${item.name.replace(/ /g, '_')}.png')">
                    <i class="fa-solid fa-download"></i> Download Texture
                </button>
            `;

            grid.appendChild(card);
            
            createMiniViewer(`preview-${item.id}`, item, card, thisRenderId);
        });

        secDiv.appendChild(grid);
        container.appendChild(secDiv);
    });
}

async function createMiniViewer(containerId, item, cardElement, thisRenderId) {
    if (thisRenderId !== currentRenderId) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 64; tempCanvas.height = 64;
    const tCtx = tempCanvas.getContext('2d');

    try {
        const bImg = await loadImage(state.baseSkinUrl);
        if (thisRenderId !== currentRenderId) return; 
        tCtx.drawImage(bImg, 0, 0);
        
        const iImg = await loadImage(item.textureUrl);
        if (thisRenderId !== currentRenderId) return; 
        tCtx.drawImage(iImg, 0, 0);
    } catch(e) { return; }

    const container = document.getElementById(containerId);
    if (!container || thisRenderId !== currentRenderId) return;

    const viewer = new skinview3d.SkinViewer({
        width: container.clientWidth || 200,
        height: container.clientHeight || 160,
        skin: tempCanvas.toDataURL('image/png'),
        model: state.modelType === 'alex' ? 'slim' : 'default'
    });

    viewer.autoRotate = false;
    viewer.autoRotateSpeed = 0.8;
    cardElement.addEventListener('mouseenter', () => viewer.autoRotate = true);
    cardElement.addEventListener('mouseleave', () => viewer.autoRotate = false);

    viewer.controls.enablePan = false; 
    viewer.controls.minDistance = 20; 
    viewer.controls.maxDistance = 60; 

    container.appendChild(viewer.canvas);
    itemViewers.push(viewer);
}

function updateCardStylesDOM() {
    const allCards = document.querySelectorAll('.item-card');
    allCards.forEach(card => {
        const itemId = card.dataset.id;
        const isEquipped = state.equippedItems.some(eq => eq.id === itemId);
        if (isEquipped) {
            card.classList.add('equipped');
        } else {
            card.classList.remove('equipped');
        }
    });
}

async function downloadUrlAsFile(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        forceDownload(blobUrl, filename);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch(e) { forceDownload(url, filename); }
}

function renderSidebarCategories() {
    const list = document.getElementById('categoryList');
    list.innerHTML = '';
    mySections.forEach(sec => {
        const li = document.createElement('li');
        li.innerText = sec.name;
        li.dataset.name = sec.name.toLowerCase();
        li.onclick = () => {
            const el = document.getElementById(`sec-${sec.id}`);
            if(el) {
                const panel = document.querySelector('.right-panel');
                panel.scrollTo({ top: el.offsetTop - panel.offsetTop - 20, behavior: 'smooth' });
            }
            document.getElementById('categorySidebar').classList.remove('open');
            document.getElementById('mainSearchBar').classList.remove('search-hidden');
        };
        list.appendChild(li);
    });
}

function filterCategories(e) {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll('#categoryList li');
    items.forEach(li => {
        li.style.display = li.dataset.name.includes(term) ? 'block' : 'none';
    });
}

function filterWardrobe(e) { renderWardrobe(e.target.value); }

function toggleEquip(item, section) {
    const index = state.equippedItems.findIndex(i => i.id === item.id);

    if (index > -1) {
        state.equippedItems.splice(index, 1);
    } else {
        const equippedInSection = state.equippedItems.filter(i => i.sectionId === section.id);
        if (equippedInSection.length >= section.maxEquip) {
            const itemToRemove = equippedInSection[0];
            const removeIndex = state.equippedItems.findIndex(i => i.id === itemToRemove.id);
            state.equippedItems.splice(removeIndex, 1);
        }
        state.equippedItems.push(item);
    }

    updateSkinTextures();
    updateCardStylesDOM();
}

function renderEquippedList() {
    const list = document.getElementById('equippedList');
    list.innerHTML = '';

    if (state.equippedItems.length === 0) {
        list.innerHTML = '<span class="empty-msg">No clothes on character</span>';
        return;
    }

    state.equippedItems.forEach(item => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `${item.name} <i class="fa-solid fa-circle-xmark" title="Remove"></i>`;
        chip.querySelector('i').addEventListener('click', () => {
            const section = mySections.find(s => s.id === item.sectionId);
            toggleEquip(item, section);
        });
        list.appendChild(chip);
    });
}

function downloadCombinedSkin() {
    mergeCanvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        forceDownload(url, 'minedresser-skin.png');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
}

function forceDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
