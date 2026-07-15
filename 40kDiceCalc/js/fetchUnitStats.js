// using official GitHub REST API endpoint
const apiIndexUrl = 'https://api.github.com/repos/wn-mitch/40kdc-data/contents/data/share-registry.json?ref=main';
let globalUnitIndex = [];


async function testConnection() {
    try {

        const response = await fetch(apiIndexUrl, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });

        console.log('Index Fetch Status:', response.status, response.statusText);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }

        const json = await response.json();


        const decodedText = atob(json.content.replace(/\n/g, ''));
        const data = JSON.parse(decodedText);


        globalUnitIndex = [...data.kinds.unit];

    } catch (err) {
        console.error('Index fetch error', err);
    }
}

testConnection();

// // component Lookup Logic
// const searchInput = document.getElementById('unit-search-input');
// const searchDropdown = document.getElementById('search-results-dropdown');

// searchInput.addEventListener('input', function (event) {
//     const currentText = event.target.value.toLowerCase();

//     if (currentText.trim() === '') {
//         searchDropdown.style.display = 'none';
//         searchDropdown.innerHTML = '';
//         return;
//     }

//     const filteredUnits = globalUnitIndex.filter((unitId) => {
//         return unitId.toLowerCase().includes(currentText);
//     });

//     const topResults = filteredUnits.slice(0, 50);
//     searchDropdown.innerHTML = '';

//     if (topResults.length === 0) {
//         searchDropdown.innerHTML = '<li style="padding: 10px; color: #8C9BA8;">No units found...</li>';
//     } else {
//         topResults.forEach(function (unit) {
//             const listItem = document.createElement('li');
//             listItem.textContent = unit;

//             listItem.style.padding = '10px';
//             listItem.style.borderBottom = '1px solid #38424D';
//             listItem.style.cursor = 'pointer';
//             listItem.style.color = '#DAE6EF';

//             listItem.addEventListener('mouseenter', () => listItem.style.backgroundColor = '#2A313A');
//             listItem.addEventListener('mouseleave', () => listItem.style.backgroundColor = 'transparent');

//             listItem.addEventListener('click', function () {
//                 console.log("User selected ID for next fetch step:", unit);
//                 searchInput.value = unit;
//                 searchDropdown.style.display = 'none';

//                 let unitId = unit;
//                 fetchUnitData(unitId);
//             });

//             searchDropdown.appendChild(listItem);
//         });
//     }

//     searchDropdown.style.display = 'block';
// });

// // detail fetch pipeline
// async function fetchUnitData(unitId) {

//     const unitURL = `https://api.github.com/repos/wn-mitch/40kdc-data/contents/data/core/unit/${unitId}.json?ref=10e-archive`;

//     try {

//         const response = await fetch(unitURL, {
//             headers: { 'Accept': 'application/vnd.github.v3+json' }
//         });

//         if (!response.ok) {
//             const text = await response.text();
//             throw new Error(`HTTP ${response.status}: ${text}`);
//         }

//         const json = await response.json();


//         const decodedText = atob(json.content.replace(/\n/g, ''));
//         const unitData = JSON.parse(decodedText);

//         console.log("Detailed Unit Stats Acquired via API:", unitData);

//     } catch (err) {
//         console.error('Detail fetch error', err);
//     }
// }

async function listBranches() {
    const BASE = "https://openhammer-api-production.up.railway.app";
    const edition = "10e"; // 10th Edition


    try {
        const response = await fetch(`${BASE}/v1/${edition}/units?name=Intercessor`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const unit = await response.json();
        console.log(unit);
    } catch (err) {
        console.error("Failed to fetch Intercessor Squad:", err);
    }
}


// Call the function
listBranches();