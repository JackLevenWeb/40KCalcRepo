
const apiUrl = 'https://api.github.com/repos/wn-mitch/40kdc-data/contents/data/core/_example/units.example.json?ref=main';


//testing github connection on api endpoint
async function testConnection() {


    try {
        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }



        });
        console.log('status', response.status, response.statusText);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);

        }
        const json = await response.json();

        if (!json || typeof json.content !== 'string') {
            throw new Error('API response missing base64 content field');
        }

        const decoded = atob(json.content.replace(/\n/g, ''));
        const data = JSON.parse(decoded);
        console.log(data);

    } catch (err) {
        console.error('API fetch error', err);


    }


}


