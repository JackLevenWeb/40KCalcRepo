import { buildRosterFromJSON } from './ui-manager.js';

const BASE = "https://openhammer-api-production.up.railway.app";
const edition = "11e";
const globalUnitIndex = new Map();
const unitNames = [];

const searchInput = document.getElementById('unit-search-input');
const searchDropdown = document.getElementById('search-results-dropdown');
const importAttackerBtn = document.getElementById('import-attacker-btn');
const importTargetBtn = document.getElementById('import-target-btn');


/**
 * architecture note:
 * This module implements paginated API fetching and local client-side caching. 
 * While the current target dataset is relatively small, this methodology simulates 
 * enterprise-grade data engineering patterns. It demonstrates how to safely interact 
 * with massive databases without overloading the main thread or hitting API rate limits.
 */

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



//fetch unit names and ids
async function fetchUnitName() {
    try {
        let offSet = 0;
        let fetching = true;

        while (fetching) {
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
                //api limited to 500 per call
                offSet += 500;
            }
        }
        console.log(`Successfully loaded ${unitNames.length} units.`);
    } catch (err) {
        console.error("Failed to fetch unit names", err);
    }
}


fetchUnitName();


async function fetchUnitDetails(unitName, importType) {
    try {
        const id = globalUnitIndex.get(unitName);
        if (!id) {
            alert(`Could not find the ID for ${unitName}. Please select it from the dropdown list.`);
            return;
        }

        const activeBtn = importType === 'attacker' ? importAttackerBtn : importTargetBtn;
        activeBtn.textContent = "Importing...";
        activeBtn.disabled = true;

        const response = await fetch(`${BASE}/v1/${edition}/units/${id}`);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const apiUnit = await response.json();

        console.log(apiUnit);

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

            activeBtn.textContent = "Import Attacker";
        }
        else if (importType === 'target') {
            populateTargetProfile(apiUnit);
            activeBtn.textContent = "Import Target";
        }

        document.dispatchEvent(new CustomEvent("App:AutoSave"));
        activeBtn.disabled = false;
        searchInput.value = "";

    } catch (err) {
        console.error("Failed to fetch unit details", err);
        if (importAttackerBtn) {
            importAttackerBtn.textContent = "Import Attacker";
            importAttackerBtn.disabled = false;
        }
        if (importTargetBtn) {
            importTargetBtn.textContent = "Import Target";
            importTargetBtn.disabled = false;
        }
    }
}





//attacker unit
function formatWeaponData(apiWeapon, apiUnit, isRanged) {

    //determine if we should use bs or ws
    const activeBsWs = isRanged ? apiWeapon.BS : apiWeapon.WS;

    const keywordStr = apiWeapon.Keywords ? apiWeapon.Keywords.toLowerCase() : "";

    const extractNumber = (regex) => {
        const match = keywordStr.match(regex);
        return match ? parseInt(match[1], 10) : 0;
    };


    // map api payload to Weapon class format
    return {
        unitName: `${apiUnit.name} (${apiWeapon.name})`,
        attack: apiWeapon.A || "1",
        BsWs: activeBsWs ? activeBsWs.replace('+', '') : "NA",
        strength: apiWeapon.S ? parseInt(apiWeapon.S, 10) : 0,
        Ap: apiWeapon.AP ? parseInt(apiWeapon.AP, 10) : 0,
        damage: apiWeapon.D || "1",
        modelCount: apiUnit.composition ? apiUnit.composition.min_models : 5,
        unitCount: 1,
        isLeader: false,
        attachTarget: null,
        grantedKeyword: "none",


        modifiers: {
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


//target unit - inconsitent api objet keys
function populateTargetProfile(apiUnit) {
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
}