const BASE = "https://openhammer-api-production.up.railway.app";
const edition = "10e"; // 10th Edition
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

    const filteredUnits = unitNames.filter((unitId) => {
        return unitId.toLowerCase().includes(currentText);
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
        const response = await fetch(`${BASE}/v1/${edition}/units`);
        console.log('Index Fetch Status:', response.status, response.statusText);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const units = await response.json();

        // console.log(units);

        for (const unit of units) {
            globalUnitIndex.set(unit.name, unit.id);
            unitNames.push(unit.name);
        }



    } catch (err) {
        console.error("Failed to fetch unit names", err);
    }
}
fetchUnitName();

async function fetchUnitDetails(unitName) {

    try {
        const id = globalUnitIndex.get(unitName);
        console.log(id);

        const response = await fetch(`${BASE}/v1/${edition}/units/${id}`);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const units = await response.json();


        console.log(units);
    } catch (err) {

        console.error("Failed to fetch unit details", err);
    }




}
