import { buildRosterFromJSON } from './ui-manager.js';


const BASE = "https://openhammer-api-production.up.railway.app";
const edition = "11e"; // 10th Edition
const globalUnitIndex = new Map();
const unitNames = [];





// component Lookup Logic
const searchInput = document.getElementById('unit-search-input');
const searchDropdown = document.getElementById('search-results-dropdown');

searchInput.addEventListener('input', function (event) {
    const currentText = event.target.value.toLowerCase();

    if (currentText.trim() === '') {
        searchDropdown.style.display = 'none';
        searchDropdown.innerHTML = '';
        return;
    }


    //filter and sort unit names
    const filteredUnits = unitNames.filter((unitId) => {
        return unitId.toLowerCase().includes(currentText);
    }).sort((a, b) => {
        const textLower = currentText.toLowerCase();
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
        searchDropdown.innerHTML = '<li style="padding: 10px; color: #8C9BA8;">No units found...</li>';
    } else {
        topResults.forEach(function (unitName) {
            const listItem = document.createElement('li');
            listItem.textContent = unitName;

            listItem.style.padding = '10px';
            listItem.style.borderBottom = '1px solid #38424D';
            listItem.style.cursor = 'pointer';
            listItem.style.color = '#DAE6EF';

            listItem.addEventListener('mouseenter', () => listItem.style.backgroundColor = '#2A313A');
            listItem.addEventListener('mouseleave', () => listItem.style.backgroundColor = 'transparent');

            listItem.addEventListener('click', function () {
                console.log("User selected ID for next fetch step:", unitName);
                searchInput.value = unitName;
                searchDropdown.style.display = 'none';

                fetchUnitDetails(unitName);

            });

            searchDropdown.appendChild(listItem);
        });
    }

    searchDropdown.style.display = 'block';
});




//fetch unit names and ids
async function fetchUnitName() {


    try {
        let offSet = 0;
        let fetching = true;


        while (fetching) {
            const response = await fetch(`${BASE}/v1/${edition}/units?limit=500&offset=${offSet}`);
            console.log('Index Fetch Status:', response.status, response.statusText);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }
            const units = await response.json();

            // console.log(units);

            //acounting for api limit of 500
            if (units.length === 0) {

                fetching = false;
            } else {


                for (const unit of units) {
                    globalUnitIndex.set(unit.name, unit.id);
                    unitNames.push(unit.name);
                }
                offSet += 500;
            }
        }
        console.log(unitNames.length);


    } catch (err) {
        console.error("Failed to fetch unit names", err);
    }
}
fetchUnitName();

async function fetchUnitDetails(unitName) {

    try {
        const id = globalUnitIndex.get(unitName);
        console.log(`Fetching details for ID: ${id}`);

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
            return;
        }

        const formattedRoster = apiWeaponsArray.map(apiWeapon => formatWeaponData(apiWeapon, apiUnit, isRanged));

        const rosterContainer = document.getElementById('attacker-roster');
        buildRosterFromJSON(rosterContainer, formattedRoster, true);

        console.log("imported and rendered:", formattedRoster);


    } catch (err) {
        console.error("Failed to fetch unit details", err);
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