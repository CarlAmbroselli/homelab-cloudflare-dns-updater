const axios = require("axios").default;
const fs = require("fs").promises;
const { exec } = require("child_process");

function ensureEnvVariable(name) {
  if (!process.env[name]) {
    console.error("Missing required process env variable:", name);
    process.exit(1);
  }
}

function checkEnvironmentVariables() {
  ensureEnvVariable("CLOUDFLARE_EMAIL");
  ensureEnvVariable("CLOUDFLARE_TOKEN");
  ensureEnvVariable("CLOUDFLARE_ZONE_ID");
  ensureEnvVariable("CLOUDFLARE_DNS_RECORD_ID");
  ensureEnvVariable("CLOUDFLARE_DNS_RECORD");
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
        if (error) {
          reject(`Error: ${error.message}`);
          return;
        }
        if (stderr) {
          reject(`Stderr: ${stderr}`);
          return;
        }
        resolve(stdout.trim()); // Remove trailing newlines from stdout
      },
    );
  });
}

function updateDns(newIp) {
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

async function writeResultToFile(newIp, updated, updateResult) {
  const result = {
    timestamp: new Date().toISOString(),
    errors: updateResult.errors,
    messages: updateResult.messages,
    success: updateResult.success,
    ip: newIp,
    updated,
  };

  await fs.writeFile("./last_run.json", JSON.stringify(result, null, 2));
}

async function main() {
  try {
    checkEnvironmentVariables();
    const newIp = await getCurrentIp();
    const dnsIp = await getDnsIp();

    if (newIp !== dnsIp) {
      let updateResult = await updateDns(newIp);
      console.log(
        `${process.env.CLOUDFLARE_DNS_RECORD} updated to point to ${newIp}`,
      );
      await writeResultToFile(newIp, true, updateResult.data);
    } else {
      await writeResultToFile(dnsIp, false, {
        errors: [],
        messages: [],
        success: true,
      });
    }
  } catch (error) {
    console.error("An error occurred:", error.message);
    await writeResultToFile(null, false, {
      errors: [error.message],
      messages: [],
      success: false,
    });
  }
}

main();
