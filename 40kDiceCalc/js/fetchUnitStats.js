import { buildRosterFromJSON } from './ui-manager.js';

const BASE = "https://openhammer-api-production.up.railway.app";
const edition = "11e";
const globalUnitIndex = new Map();
const unitNames = [];

const searchInput = document.getElementById('unit-search-input');
const searchDropdown = document.getElementById('search-results-dropdown');
const importApiBtn = document.getElementById('import-api-btn');


/**
 * Architecture Note:
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

importApiBtn.addEventListener('click', () => {
    const unitName = searchInput.value.trim();
    if (!unitName) {
        alert("Please select a unit to import.");
        return;
    }
    fetchUnitDetails(unitName);
});



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
async function fetchUnitDetails(unitName) {
    try {
        const id = globalUnitIndex.get(unitName);
        if (!id) {
            alert(`Could not find the ID for ${unitName}. Please select it from the dropdown list.`);
            return;
        }

        importApiBtn.textContent = "Importing...";
        importApiBtn.disabled = true;

        const response = await fetch(`${BASE}/v1/${edition}/units/${id}`);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const apiUnit = await response.json();

        console.log(apiUnit);

        const weaponTypeToggle = document.getElementById('weapon-type-toggle');
        const weaponMode = weaponTypeToggle.value;
        const isRanged = weaponMode === 'ranged';

        const apiWeaponsArray = apiUnit.weapons[weaponMode];

        if (!apiWeaponsArray || apiWeaponsArray.length === 0) {
            alert(`The ${apiUnit.name} does not have any ${weaponMode} weapons equipped.`);
            importApiBtn.textContent = "Import Unit";
            importApiBtn.disabled = false;
            return;
        }

        const formattedRoster = apiWeaponsArray.map(apiWeapon => formatWeaponData(apiWeapon, apiUnit, isRanged));

        const rosterContainer = document.getElementById('attacker-roster');
        buildRosterFromJSON(rosterContainer, formattedRoster, false);
        document.dispatchEvent(new CustomEvent("App:AutoSave"));

        importApiBtn.textContent = "Import Unit";
        importApiBtn.disabled = false;
        searchInput.value = "";

    } catch (err) {
        console.error("Failed to fetch unit details", err);
        importApiBtn.textContent = "Import Unit";
        importApiBtn.disabled = false;
    }
}






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