const fs = require("fs").promises;
const { getCurrentIp, getDnsIp, lastRunTimestamp } = require("./dns");

function isTimestampRecent(timestamp) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(timestamp) > fiveMinutesAgo;
}

async function generateHealthCheckResponse() {
  const currentIp = await getCurrentIp();
  const dnsIp = await getDnsIp();

  return {
    lastDnsUpdateTimestamp: lastRunTimestamp ? lastRunTimestamp : null,
    lastDnsCheckTimestamp: new Date().toISOString(),
    isLastCheckRecent: lastRunTimestamp
      ? isTimestampRecent(lastRunTimestamp)
      : false,
    isCurrentIpEqualToDnsIp: currentIp === dnsIp,
    currentIp,
    dnsIp,
  };
}

module.exports = {
  generateHealthCheckResponse,
};
