const { getCurrentIp, getDnsIp } = require("./dns");

function isTimestampRecent(timestamp) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(timestamp) > fiveMinutesAgo;
}

async function generateHealthCheckResponse(lastRun = {}) {
  const currentIp = await getCurrentIp();
  const dnsIp = await getDnsIp();

  return {
    lastDnsCheckTimestamp: lastRun.timestamp,
    isLastCheckRecent: lastRun.timestamp
      ? isTimestampRecent(lastRun.timestamp)
      : false,
    isCurrentIpEqualToDnsIp: currentIp === dnsIp,
    currentIp,
    dnsIp,
  };
}

module.exports = {
  generateHealthCheckResponse,
};
