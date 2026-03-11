async function testApi() {
    try {
        const response = await fetch('http://localhost:3000/api/xmatrix');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        const data = await response.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}
testApi();
