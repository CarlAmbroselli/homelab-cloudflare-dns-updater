const axios = require('axios').default;

function ensureEnvVariable(name) {
    if (!process.env[name]) {
        console.error("Missing required process env variable:", name)
        process.exit(1)
    }
}

function checkEnvironmentVariables() {
    ensureEnvVariable("CLOUDFLARE_EMAIL")
    ensureEnvVariable("CLOUDFLARE_TOKEN")
    ensureEnvVariable("CLOUDFLARE_ZONE_ID")
    ensureEnvVariable("CLOUDFLARE_DNS_RECORD_ID")
    ensureEnvVariable("CLOUDFLARE_DNS_RECORD")
}

async function getCurrentIp() {
    let response = await axios.get('https://ifconfig.co/ip');
    return response.data.trim();
}

function updateDns(newIp) {
    const url = `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records/${process.env.CLOUDFLARE_DNS_RECORD_ID}`;
    const headers = {
        'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
        'X-Auth-Key': process.env.CLOUDFLARE_TOKEN,
        'Content-Type': 'application/json'
    };
    const data = {
        "type":"A",
        "name": process.env.CLOUDFLARE_DNS_RECORD,
        "content": newIp,
        "ttl":1,
        "proxied": false
    };

    return axios.put(url, data, {headers});
}

async function main() {
    checkEnvironmentVariables()
    let newIp = await getCurrentIp()
    updateDns(newIp)
}

main()
