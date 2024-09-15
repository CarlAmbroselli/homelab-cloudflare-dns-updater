const fs = require("fs").promises;
const { getCurrentIp, getDnsIp } = require("./dns");

async function readLastRunJson() {
  try {
    const data = await fs.readFile("./last_run.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading last_run.json:", error);
    return null;
  }
}

function isTimestampRecent(timestamp) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(timestamp) > fiveMinutesAgo;
}

async function generateHealthCheckResponse() {
  const lastRun = await readLastRunJson();
  const currentIp = await getCurrentIp();
  const dnsIp = await getDnsIp();

  return {
    lastDnsUpdateTimestamp: lastRun ? lastRun.timestamp : null,
    lastDnsCheckTimestamp: new Date().toISOString(),
    isLastCheckRecent: lastRun ? isTimestampRecent(lastRun.timestamp) : false,
    isCurrentIpEqualToDnsIp: currentIp === dnsIp,
    currentIp,
    dnsIp,
    errors: lastRun ? lastRun.errors : [],
    success: lastRun ? lastRun.success : false,
  };
}

module.exports = {
  generateHealthCheckResponse,
};
