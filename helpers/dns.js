const axios = require("axios").default;
const { exec } = require("child_process");

function checkEnvironmentVariables() {
  const requiredEnvVars = [
    "CLOUDFLARE_EMAIL",
    "CLOUDFLARE_TOKEN",
    "CLOUDFLARE_ZONE_ID",
    "CLOUDFLARE_DNS_RECORD_ID",
    "CLOUDFLARE_DNS_RECORD",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }
}

async function getCurrentIp() {
  let response = await axios.get("https://ifconfig.co/ip");
  return response.data.trim();
}

async function getDnsIp() {
  return new Promise((resolve, reject) => {
    exec(
      `dig @1.1.1.1 "${process.env.CLOUDFLARE_DNS_RECORD}" +short`,
      (error, stdout, stderr) => {
        if (error) reject(`Error: ${error.message}`);
        else if (stderr) reject(`Stderr: ${stderr}`);
        else resolve(stdout.trim());
      },
    );
  });
}

async function updateDns(newIp) {
  const url = `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records/${process.env.CLOUDFLARE_DNS_RECORD_ID}`;
  const headers = {
    "X-Auth-Email": process.env.CLOUDFLARE_EMAIL,
    "X-Auth-Key": process.env.CLOUDFLARE_TOKEN,
    "Content-Type": "application/json",
  };
  const data = {
    type: "A",
    name: process.env.CLOUDFLARE_DNS_RECORD,
    content: newIp,
    ttl: 1,
    proxied: false,
  };

  return axios.put(url, data, { headers });
}

async function performDnsCheck() {
  try {
    const newIp = await getCurrentIp();
    const dnsIp = await getDnsIp();
    let updated = false;
    let updateResult = { success: true, errors: [], messages: [] };

    if (newIp !== dnsIp) {
      updateResult = (await updateDns(newIp)).data;
      updated = true;
      console.log(
        `${process.env.CLOUDFLARE_DNS_RECORD} updated to point to ${newIp}`,
      );
    }

    return {
      timestamp: new Date().toISOString(),
      errors: updateResult.errors,
      messages: updateResult.messages,
      success: updateResult.success,
      ip: newIp,
      updated,
    };
  } catch (error) {
    console.error("An error occurred:", error.message);
    return {
      timestamp: new Date().toISOString(),
      errors: [error.message],
      messages: [],
      success: false,
      ip: null,
      updated: false,
    };
  }
}

module.exports = {
  checkEnvironmentVariables,
  getCurrentIp,
  getDnsIp,
  performDnsCheck,
};
