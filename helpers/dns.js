const axios = require("axios").default;
const { exec } = require("child_process");

let lastRun = {};

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
  try {
    const response = await axios.get("https://ifconfig.co/ip", {
      timeout: 10000, // 10-second timeout
      validateStatus: function (status) {
        return status >= 200 && status < 300; // Reject only if the status code is not in 2xx range
      }
    });

    if (!response.data) {
      throw new Error("No IP data received");
    }

    const ip = response.data.trim();

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      throw new Error(`Invalid IP format: ${ip}`);
    }

    console.log("IP retrieval successful:", ip);
    return ip;
  } catch (error) {
    console.error("Error retrieving current IP:", {
      message: error.message,
      code: error.code,
      status: error.response ? error.response.status : 'N/A',
      responseData: error.response ? error.response.data : 'N/A'
    });

    // Provide a more informative error
    if (error.code === 'ENOTFOUND') {
      throw new Error("Unable to resolve IP service hostname. Check internet connection.");
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error("IP retrieval timed out. Check network connectivity.");
    } else {
      throw error; // Re-throw other errors
    }
  }
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
    console.log("Current IP:", newIp);
    
    let dnsIp;
    try {
      dnsIp = await getDnsIp();
      console.log("DNS IP:", dnsIp);
    } catch (dnsError) {
      console.error("DNS resolution error:", dnsError);
      throw dnsError; // Re-throw to be caught by outer catch
    }

    let updated = false;
    let updateResult = { success: true, errors: [], messages: [] };

    if (newIp !== dnsIp) {
      try {
        updateResult = (await updateDns(newIp)).data;
        updated = true;
        console.log(
          `${process.env.CLOUDFLARE_DNS_RECORD} updated to point to ${newIp}`,
        );
      } catch (updateError) {
        console.error("Update DNS error:", updateError);
        updateResult.success = false;
        updateResult.errors = [updateError.message];
      }
    }

    lastRun.timestamp = new Date().toISOString();

    return {
      timestamp: new Date().toISOString(),
      errors: updateResult.errors,
      messages: updateResult.messages,
      success: updateResult.success,
      ip: newIp,
      updated,
    };
  } catch (error) {
    console.error("Full error details:", error); // Log full error
    return {
      timestamp: new Date().toISOString(),
      errors: [error.message || 'Unknown error'],
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
  lastRun,
};
