const fs = require("fs").promises;
const { getCurrentIp, getDnsIp, lastRunTimestamp } = require("./dns");

function isTimestampRecent(timestamp) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(timestamp) > fiveMinutesAgo;
}

async function generateHealthCheckResponse() {
  const lastRun = await readLastRunJson();
  const currentIp = await getCurrentIp();
  const dnsIp = await getDnsIp();

  return {
    lastDnsUpdateTimestamp: lastRunTimestamp ? lastRunTimestamp : null,
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
