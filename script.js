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

    document.getElementById('btnToggleSidebar').addEventListener('click', openSidebar);
    document.getElementById('btnCloseSidebar').addEventListener('click', closeSidebar);

    document.getElementById('searchCategoryInput').addEventListener('input', filterCategories);

    document.querySelectorAll('.anim-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.anim-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            changeAnimation(e.currentTarget.dataset.anim);
        });
    });

    setupSearchSuggestions();
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

    // 1. Try Official Mojang Session API (100% real-time, no caching delay)
    try {
        const profileRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData && profileData.id) {
                const sessionRes = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${profileData.id}`);
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    const texturesProp = sessionData.properties?.find(p => p.name === 'textures');
                    if (texturesProp) {
                        const decoded = JSON.parse(atob(texturesProp.value));
                        let skinTextureUrl = decoded.textures?.SKIN?.url;
                        const isSlim = decoded.textures?.SKIN?.metadata?.model === 'slim';
                        
                        if (skinTextureUrl) {
                            // Convert http:// to https:// to prevent Mixed Content security blocking
                            skinTextureUrl = skinTextureUrl.replace(/^http:\/\//, 'https://');
                            const img = await loadImage(skinTextureUrl);
                            const tempCanvas = document.createElement('canvas');
                            tempCanvas.width = 64; 
                            tempCanvas.height = 64;
                            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                            tempCtx.drawImage(img, 0, 0);

                            const alpha = tempCtx.getImageData(54, 20, 1, 1).data[3];
                            state.modelType = isSlim ? 'alex' : ((alpha === 0) ? 'alex' : 'steve');

                            const radioBtn = document.querySelector(`input[name="modelType"][value="${state.modelType}"]`);
                            if (radioBtn) radioBtn.checked = true;

                            errorDisplay.innerText = "";
                            startGame(tempCanvas.toDataURL('image/png'));
                            return;
                        }
                    }
                }
            }
        }
    } catch(mojangErr) {
        console.warn("Direct Mojang API fetch unavailable/CORS, switching to proxies...", mojangErr);
    }

    // 2. Fallback to Crafthead Profile API
    try {
        const craftheadRes = await fetch(`https://crafthead.net/profile/${username}`);
        if (craftheadRes.ok) {
            const data = await craftheadRes.json();
            const prop = data.properties?.find(p => p.name === 'textures');
            if (prop) {
                const decoded = JSON.parse(atob(prop.value));
                let skinTextureUrl = decoded.textures?.SKIN?.url;
                if (skinTextureUrl) {
                    skinTextureUrl = skinTextureUrl.replace(/^http:\/\//, 'https://');
                    const img = await loadImage(skinTextureUrl);
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = 64; tempCanvas.height = 64;
                    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                    tempCtx.drawImage(img, 0, 0);

                    const alpha = tempCtx.getImageData(54, 20, 1, 1).data[3];
                    state.modelType = (alpha === 0) ? 'alex' : 'steve';

                    const radioBtn = document.querySelector(`input[name="modelType"][value="${state.modelType}"]`);
                    if (radioBtn) radioBtn.checked = true;

                    errorDisplay.innerText = "";
                    startGame(tempCanvas.toDataURL('image/png'));
                    return;
                }
            }
        }
    } catch(craftheadErr) { }

    // 3. Fallback to PlayerDB API
    try {
        const res = await fetch(`https://playerdb.co/api/player/minecraft/${username}`);
        if (res.ok) {
            const data = await res.json();
            if (data.code === "player.found" && data.data?.player?.raw_id) {
                const skinUrl = data.data.player.skin_texture;
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
                return;
            }
        }
    } catch(e) { }

    // 4. Fallback to Minotar direct image load
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
    closeSidebar();

    currentRenderId++;
    textureUpdateId++;
    if (catalogOffscreenViewer) {
        catalogOffscreenViewer.dispose();
        catalogOffscreenViewer = null;
        const c = document.getElementById('catalogOffscreenContainer');
        if (c && c.parentNode) c.parentNode.removeChild(c);
    }
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

let catalogOffscreenViewer = null;

function getCatalogOffscreenViewer() {
    if (!catalogOffscreenViewer) {
        const container = document.createElement('div');
        container.id = 'catalogOffscreenContainer';
        container.style.cssText = 'position:absolute; width:200px; height:200px; top:-9999px; left:-9999px; pointer-events:none; visibility:hidden;';
        document.body.appendChild(container);

        catalogOffscreenViewer = new skinview3d.SkinViewer({
            width: 200,
            height: 200,
            skin: state.baseSkinUrl || 'https://minotar.net/skin/MHF_Steve',
            model: state.modelType === 'alex' ? 'slim' : 'default'
        });
        catalogOffscreenViewer.fov = 70;
        catalogOffscreenViewer.zoom = 0.95;
        catalogOffscreenViewer.playerObject.rotation.y = 0.5;
        catalogOffscreenViewer.autoRotate = false;
        container.appendChild(catalogOffscreenViewer.canvas);
    }
    return catalogOffscreenViewer;
}

function renderWardrobe(filterText = "") {
    const thisRenderId = ++currentRenderId; 
    const container = document.getElementById('wardrobeContent');
    container.innerHTML = '';

    const visibleItems = [];

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
            visibleItems.push(item);
            const isEquipped = state.equippedItems.some(eq => eq.id === item.id);
            const card = document.createElement('div');
            card.className = `item-card ${isEquipped ? 'equipped' : ''}`;
            card.dataset.id = item.id;
            
            card.onclick = () => toggleEquip(item, section);

            const authorHtml = (item.author.url && item.author.url.length > 2)
                ? `<a href="${item.author.url}" target="_blank" onclick="event.stopPropagation()">${item.author.name}</a>` 
                : `<span>${item.author.name}</span>`;

            card.innerHTML = `
                <div class="item-3d-preview" id="preview-${item.id}">
                    <img id="thumb-${item.id}" class="item-3d-thumb" alt="${item.name}" src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>">
                </div>
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
        });

        secDiv.appendChild(grid);
        container.appendChild(secDiv);
    });

    generateWardrobeThumbnails(visibleItems, thisRenderId);
}

async function generateWardrobeThumbnails(itemsToRender, thisRenderId) {
    if (itemsToRender.length === 0) return;

    const viewer = getCatalogOffscreenViewer();
    viewer.model = state.modelType === 'alex' ? 'slim' : 'default';

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 64; 
    tempCanvas.height = 64;
    const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    let baseImg;
    try {
        baseImg = await loadImage(state.baseSkinUrl);
    } catch(e) {
        return;
    }

    for (const item of itemsToRender) {
        if (thisRenderId !== currentRenderId) break;
        const imgEl = document.getElementById(`thumb-${item.id}`);
        if (!imgEl) continue;

        try {
            tCtx.clearRect(0, 0, 64, 64);
            tCtx.drawImage(baseImg, 0, 0);
            
            const itemImg = await loadImage(item.textureUrl);
            if (thisRenderId !== currentRenderId) break;
            tCtx.drawImage(itemImg, 0, 0);

            await viewer.loadSkin(tempCanvas.toDataURL('image/png'));
            if (thisRenderId !== currentRenderId) break;

            viewer.render();
            const dataUrl = viewer.canvas.toDataURL('image/png');
            imgEl.src = dataUrl;
        } catch(e) {
            console.error("Error rendering thumbnail for item", item.id, e);
        }
    }
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

function openSidebar() {
    document.getElementById('categorySidebar').classList.add('open');
    document.getElementById('mainSearchBar').classList.add('search-hidden');
    document.getElementById('btnToggleSidebar').classList.add('btn-hidden');
}

function closeSidebar() {
    document.getElementById('categorySidebar').classList.remove('open');
    document.getElementById('mainSearchBar').classList.remove('search-hidden');
    document.getElementById('btnToggleSidebar').classList.remove('btn-hidden');
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
            closeSidebar();
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

let selectedWardrobeIndex = -1;
let selectedCategoryIndex = -1;

function setupSearchSuggestions() {
    const searchInput = document.getElementById('searchInput');
    const wardrobeSuggestions = document.getElementById('wardrobeSuggestions');

    const searchCategoryInput = document.getElementById('searchCategoryInput');
    const categorySuggestions = document.getElementById('categorySuggestions');

    if (!searchInput || !wardrobeSuggestions || !searchCategoryInput || !categorySuggestions) return;

    // Wardrobe search autocomplete suggestions
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        selectedWardrobeIndex = -1;
        
        if (!query) {
            wardrobeSuggestions.classList.add('hidden');
            wardrobeSuggestions.innerHTML = '';
            return;
        }

        const matchingItems = myItems.filter(item => {
            const itemType = (item.type || 'all').toLowerCase();
            if (itemType !== 'all' && itemType !== state.modelType) return false;
            return item.name.toLowerCase().includes(query) || 
                   (item.description && item.description.toLowerCase().includes(query)) ||
                   item.author.name.toLowerCase().includes(query);
        }).slice(0, 5);

        const matchingSections = mySections.filter(sec => 
            sec.name.toLowerCase().includes(query)
        ).slice(0, 3);

        if (matchingItems.length === 0 && matchingSections.length === 0) {
            wardrobeSuggestions.classList.add('hidden');
            wardrobeSuggestions.innerHTML = '';
            return;
        }

        wardrobeSuggestions.innerHTML = '';

        if (matchingItems.length > 0) {
            const header = document.createElement('div');
            header.className = 'suggestion-header';
            header.innerText = 'Clothes';
            wardrobeSuggestions.appendChild(header);

            matchingItems.forEach(item => {
                const section = mySections.find(s => s.id === item.sectionId);
                const itemEl = document.createElement('div');
                itemEl.className = 'suggestion-item';
                itemEl.innerHTML = `
                    <span><i class="fa-solid fa-shirt"></i> ${item.name}</span>
                    <span class="item-type-tag">${section ? section.name : ''}</span>
                `;
                itemEl.onclick = () => {
                    searchInput.value = item.name;
                    renderWardrobe(item.name);
                    wardrobeSuggestions.classList.add('hidden');
                };
                wardrobeSuggestions.appendChild(itemEl);
            });
        }

        if (matchingSections.length > 0) {
            const header = document.createElement('div');
            header.className = 'suggestion-header';
            header.innerText = 'Categories';
            wardrobeSuggestions.appendChild(header);

            matchingSections.forEach(sec => {
                const secEl = document.createElement('div');
                secEl.className = 'suggestion-item';
                secEl.innerHTML = `
                    <span><i class="fa-solid fa-folder"></i> ${sec.name}</span>
                    <span class="item-type-tag">Category</span>
                `;
                secEl.onclick = () => {
                    searchInput.value = sec.name;
                    renderWardrobe(sec.name);
                    wardrobeSuggestions.classList.add('hidden');
                };
                wardrobeSuggestions.appendChild(secEl);
            });
        }

        wardrobeSuggestions.classList.remove('hidden');
    });

    // Keyboard navigation for wardrobe search
    searchInput.addEventListener('keydown', (e) => {
        const items = wardrobeSuggestions.querySelectorAll('.suggestion-item');
        if (items.length === 0 || wardrobeSuggestions.classList.contains('hidden')) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedWardrobeIndex = (selectedWardrobeIndex + 1) % items.length;
            updateSelection(items, selectedWardrobeIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedWardrobeIndex = (selectedWardrobeIndex - 1 + items.length) % items.length;
            updateSelection(items, selectedWardrobeIndex);
        } else if (e.key === 'Enter') {
            if (selectedWardrobeIndex >= 0 && items[selectedWardrobeIndex]) {
                e.preventDefault();
                items[selectedWardrobeIndex].click();
            }
        } else if (e.key === 'Escape') {
            wardrobeSuggestions.classList.add('hidden');
        }
    });

    // Category search suggestions
    searchCategoryInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        selectedCategoryIndex = -1;

        if (!query) {
            categorySuggestions.classList.add('hidden');
            categorySuggestions.innerHTML = '';
            return;
        }

        const matchingSections = mySections.filter(sec => 
            sec.name.toLowerCase().includes(query)
        );

        if (matchingSections.length === 0) {
            categorySuggestions.classList.add('hidden');
            categorySuggestions.innerHTML = '';
            return;
        }

        categorySuggestions.innerHTML = '';

        matchingSections.forEach(sec => {
            const secEl = document.createElement('div');
            secEl.className = 'suggestion-item';
            secEl.innerHTML = `
                <span><i class="fa-solid fa-layer-group"></i> ${sec.name}</span>
            `;
            secEl.onclick = () => {
                searchCategoryInput.value = sec.name;
                filterCategories({ target: { value: sec.name } });
                categorySuggestions.classList.add('hidden');

                const el = document.getElementById(`sec-${sec.id}`);
                if (el) {
                    const panel = document.querySelector('.right-panel');
                    panel.scrollTo({ top: el.offsetTop - panel.offsetTop - 20, behavior: 'smooth' });
                }
                closeSidebar();
            };
            categorySuggestions.appendChild(secEl);
        });

        categorySuggestions.classList.remove('hidden');
    });

    // Keyboard navigation for category search
    searchCategoryInput.addEventListener('keydown', (e) => {
        const items = categorySuggestions.querySelectorAll('.suggestion-item');
        if (items.length === 0 || categorySuggestions.classList.contains('hidden')) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedCategoryIndex = (selectedCategoryIndex + 1) % items.length;
            updateSelection(items, selectedCategoryIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedCategoryIndex = (selectedCategoryIndex - 1 + items.length) % items.length;
            updateSelection(items, selectedCategoryIndex);
        } else if (e.key === 'Enter') {
            if (selectedCategoryIndex >= 0 && items[selectedCategoryIndex]) {
                e.preventDefault();
                items[selectedCategoryIndex].click();
            }
        } else if (e.key === 'Escape') {
            categorySuggestions.classList.add('hidden');
        }
    });

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
        const mainBar = document.getElementById('mainSearchBar');
        const catBar = document.getElementById('categorySearchBar');

        if (mainBar && !mainBar.contains(e.target)) {
            wardrobeSuggestions.classList.add('hidden');
        }
        if (catBar && !catBar.contains(e.target)) {
            categorySuggestions.classList.add('hidden');
        }
    });
}

function updateSelection(items, index) {
    items.forEach((item, i) => {
        if (i === index) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
}
