//#region imports >>>>>>>>>>>>>>>>>>>>>>>

// buildRosterFromJSON from ui-manager.js
import { buildRosterFromJSON } from './ui-manager.js';

//#endregion

//#region global state >>>>>>>>>>>>>>>>>>>>>>>

const BASE = "https://openhammer-api-production.up.railway.app";
const edition = "11e";
const globalUnitIndex = new Map();
const unitNames = [];

const searchInput = document.getElementById('unit-search-input');
const searchDropdown = document.getElementById('search-results-dropdown');
const importAttackerBtn = document.getElementById('import-attacker-btn');
const importTargetBtn = document.getElementById('import-target-btn');

// implements paginated api fetching and local client-side caching
// safely interacts with databases without overloading main thread

//#endregion

//#region search logic >>>>>>>>>>>>>>>>>>>>>>>

searchInput.addEventListener('input', function (event) {
    const currentText = event.target.value.toLowerCase();

    if (currentText.trim() === '') {
        searchDropdown.style.display = 'none';
        searchDropdown.innerHTML = '';
        return;
    }

    const filteredUnits = unitNames.filter((unitId) => {
        return unitId.toLowerCase().includes(currentText);
    }).sort((a, b) => {
        const textLower = currentText;
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();

        const aStarts = aLower.startsWith(textLower);
        const bStarts = bLower.startsWith(textLower);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return aLower.localeCompare(bLower);
    });

    const topResults = filteredUnits.slice(0, 50);

    searchDropdown.innerHTML = '';

    if (topResults.length === 0) {
        searchDropdown.innerHTML = '<li style="padding: 10px; color: var(--theme-text-muted);">No units found...</li>';
    } else {
        topResults.forEach(function (unitName) {
            const listItem = document.createElement('li');

            listItem.textContent = unitName;
            listItem.style.padding = '10px';
            listItem.style.borderBottom = '1px solid var(--border-color)';
            listItem.style.cursor = 'pointer';
            listItem.style.color = 'var(--theme-text-light)';

            listItem.addEventListener('mouseenter', () => listItem.style.backgroundColor = 'var(--surface-hover)');
            listItem.addEventListener('mouseleave', () => listItem.style.backgroundColor = 'transparent');

            listItem.addEventListener('click', function () {
                searchInput.value = unitName;
                searchDropdown.style.display = 'none';
            });

            searchDropdown.appendChild(listItem);
        });
    }

    searchDropdown.style.display = 'block';
});

function handleImportClick(importType) {
    const unitName = searchInput.value.trim();

    if (!unitName) {
        alert("Please select a unit to import.");
        return;
    }

    fetchUnitDetails(unitName, importType);
}

if (importAttackerBtn) importAttackerBtn.addEventListener('click', () => handleImportClick('attacker'));
if (importTargetBtn) importTargetBtn.addEventListener('click', () => handleImportClick('target'));

//#endregion

//#region api fetching >>>>>>>>>>>>>>>>>>>>>>>

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// fetches unit names and ids
async function fetchUnitName() {
    const maxRetries = 3;
    const retryDelayMs = 1500;

    let offSet = 0;
    let fetching = true;

    while (fetching) {
        let attempt = 1;
        let success = false;

        // retry loop
        while (attempt <= maxRetries && !success) {
            try {
                const response = await fetch(`${BASE}/v1/${edition}/units?limit=500&offset=${offSet}`);

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`HTTP ${response.status}: ${text}`);
                }

                const units = await response.json();

                if (units.length === 0) {
                    fetching = false;
                } else {
                    for (const unit of units) {
                        globalUnitIndex.set(unit.name, unit.id);
                        unitNames.push(unit.name);
                    }
                    offSet += 500; // api limited to 500 per call
                }

                success = true;
            } catch (err) {
                console.warn(`[API] fetchUnitName chunk failed (Attempt ${attempt}):`, err.message);

                if (attempt < maxRetries) {
                    await sleep(retryDelayMs);
                } else {
                    console.error("[API] Failed to fetch unit names after maximum retries.");
                    fetching = false; // Stop the pagination if the API is completely down
                }
                attempt++;
            }
        }
    }

    console.log(`Successfully loaded ${unitNames.length} units into the search index.`);
}

fetchUnitName();

// fetche specific unit
async function fetchUnitDetails(unitName, importType) {
    const id = globalUnitIndex.get(unitName);

    if (!id) {
        alert(`Could not find the ID for ${unitName}. Please select it from the dropdown list.`);
        return;
    }

    const activeBtn = importType === 'attacker' ? importAttackerBtn : importTargetBtn;
    activeBtn.textContent = "Importing...";
    activeBtn.disabled = true;

    const maxRetries = 3;
    const retryDelayMs = 1500;

    // retry loop
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(`${BASE}/v1/${edition}/units/${id}`);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const apiUnit = await response.json();
            console.log("Unit Data Imported:", apiUnit);

            if (importType === 'attacker') {
                const weaponTypeToggle = document.getElementById('weapon-type-toggle');
                const weaponMode = weaponTypeToggle.value;
                const isRanged = weaponMode === 'ranged';

                const apiWeaponsArray = apiUnit.weapons ? apiUnit.weapons[weaponMode] : [];

                if (!apiWeaponsArray || apiWeaponsArray.length === 0) {
                    alert(`The ${apiUnit.name} does not have any ${weaponMode} weapons equipped.`);
                    activeBtn.textContent = "Import Attacker";
                    activeBtn.disabled = false;
                    return;
                }

                const formattedRoster = apiWeaponsArray.map(apiWeapon => formatWeaponData(apiWeapon, apiUnit, isRanged));
                const rosterContainer = document.getElementById('attacker-roster');

                buildRosterFromJSON(rosterContainer, formattedRoster, false);

                // sets the faction dropdown for imported attacker modules
                if (apiUnit.faction) {
                    const factionDrops = rosterContainer.querySelectorAll(".in-faction");
                    factionDrops.forEach(drop => {
                        drop.value = apiUnit.faction;
                    });
                }

                activeBtn.textContent = "Import Attacker";
            } else if (importType === 'target') {
                populateTargetProfile(apiUnit);
                activeBtn.textContent = "Import Target";
            }

            document.dispatchEvent(new CustomEvent("App:AutoSave"));
            activeBtn.disabled = false;
            searchInput.value = "";

            break;

        } catch (err) {
            console.warn(`[API] fetchUnitDetails failed (Attempt ${attempt}):`, err.message);

            if (attempt < maxRetries) {
                // update the UI with retry info
                activeBtn.textContent = `Retrying (${attempt}/${maxRetries})...`;
                await sleep(retryDelayMs);
            } else {
                console.error("[API] Failed to fetch unit details after maximum retries.", err);

                // reset buttons on failure
                if (importAttackerBtn) {
                    importAttackerBtn.textContent = "Import Attacker";
                    importAttackerBtn.disabled = false;
                }
                if (importTargetBtn) {
                    importTargetBtn.textContent = "Import Target";
                    importTargetBtn.disabled = false;
                }

                alert("Network error: Failed to connect to the OpenHammer database. Please try again.");
            }
        }
    }
}

//#endregion

//#region data formatting >>>>>>>>>>>>>>>>>>>>>>>

// formats attacker unit payload
function formatWeaponData(apiWeapon, apiUnit, isRanged) {

    // determines bs or ws usage
    const activeBsWs = isRanged ? apiWeapon.BS : apiWeapon.WS;

    const keywordStr = apiWeapon.Keywords ? apiWeapon.Keywords.toLowerCase() : "";

    const extractNumber = (regex) => {
        const match = keywordStr.match(regex);
        return match ? parseInt(match[1], 10) : 0;
    };

    // maps api payload to weapon class format
    return {
        unitName: `${apiUnit.name} (${apiWeapon.name})`,
        faction: apiUnit.faction || "Unknown",
        attack: apiWeapon.A || "1",
        BsWs: activeBsWs ? activeBsWs.replace('+', '') : "NA",
        strength: apiWeapon.S ? parseInt(apiWeapon.S, 10) : 0,
        Ap: apiWeapon.AP ? parseInt(apiWeapon.AP, 10) : 0,
        damage: apiWeapon.D || "1",
        modelCount: apiUnit.composition ? apiUnit.composition.min_models : 5,
        unitCount: 1,
        isLeader: false,
        attachTargetId: null, // updated to match new id architecture
        grantedKeyword: "none",

        modifiers: {
            // ... (keep your existing modifiers here)
            lethal: keywordStr.includes("lethal hits"),
            devastating: keywordStr.includes("devastating wounds"),
            torrent: keywordStr.includes("torrent"),
            twinLinked: keywordStr.includes("twin-linked"),
            blast: keywordStr.includes("blast"),
            cleave: keywordStr.includes("cleave"),
            lance: keywordStr.includes("lance"),

            sustained: extractNumber(/sustained hits (\d+)/),
            melta: extractNumber(/melta (\d+)/),
            rapidFire: extractNumber(/rapid fire (\d+)/),
            anti: extractNumber(/anti-.*?(\d+)/),

            hitMod: 0,
            woundMod: 0,
            rerollHits: "none",
            rerollWounds: "none",
            critHitThreshold: 6,
            critWoundThreshold: 6
        }
    };
}

// formats target unit payload dealing with inconsistent api keys
function populateTargetProfile(apiUnit) {
    // update the target name input
    const nameInput = document.getElementById("target-name");
    if (nameInput && apiUnit.name) {
        nameInput.value = apiUnit.name;
    }

    let profile = apiUnit.stats ? (Array.isArray(apiUnit.stats) ? apiUnit.stats[0] : apiUnit.stats) : null;

    if (!profile) profile = apiUnit.profiles ? (Array.isArray(apiUnit.profiles) ? apiUnit.profiles[0] : apiUnit.profiles) : null;

    if (profile) {
        if (profile.T || profile.t) document.getElementById('toughness').value = parseInt(profile.T || profile.t, 10);
        if (profile.W || profile.w) document.getElementById('wounds').value = parseInt(profile.W || profile.w, 10);

        const sv = profile.SV || profile.Sv || profile.sv;

        if (sv) document.getElementById('save').value = parseInt(String(sv).replace('+', ''), 10);

        const inv = apiUnit.invuln_save || (profile.Inv || profile.inv);

        if (inv && inv !== "-") {
            document.getElementById('inVul').value = parseInt(String(inv).replace('+', ''), 10);
        } else {
            document.getElementById('inVul').value = "";
        }
    }

    if (apiUnit.composition && apiUnit.composition.min_models) {
        document.getElementById('target-models').value = apiUnit.composition.min_models;
    }

    const defMods = [
        "def-minus-hit",
        "def-minus-wound",
        "def-minus-wound-str",
        "def-cover",
        "def-plus-one-save"
    ];

    defMods.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });

    const reduceDam = document.getElementById("def-reduce-dam");
    if (reduceDam) reduceDam.value = "none";

    const fnpDrop = document.getElementById("def-fnp");
    if (fnpDrop) fnpDrop.value = "0";

    // sets the target faction dropdown
    const factionDrop = document.getElementById("target-faction");
    if (factionDrop && apiUnit.faction) {
        factionDrop.value = apiUnit.faction;
    }
}

//#endregion