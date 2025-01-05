const promClient = require("prom-client");

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "cloudflare-dns-updater",
});

// Define metrics
const metrics = {
  lastCheckTimestamp: new promClient.Gauge({
    name: "dns_last_check_timestamp_seconds",
    help: "Timestamp of the last DNS check",
    registers: [register],
  }),

  dnsCheckSuccess: new promClient.Gauge({
    name: "dns_check_success",
    help: "Whether the last DNS check was successful (1 for success, 0 for failure)",
    registers: [register],
  }),

  ipMatchStatus: new promClient.Gauge({
    name: "dns_ip_match_status",
    help: "Whether the current IP matches the DNS IP (1 for match, 0 for mismatch)",
    registers: [register],
  }),

  dnsUpdates: new promClient.Counter({
    name: "dns_updates_total",
    help: "Total number of DNS updates performed",
    registers: [register],
  }),

  dnsErrors: new promClient.Counter({
    name: "dns_errors_total",
    help: "Total number of DNS update errors",
    registers: [register],
  }),
};

// Function to update metrics
function updateMetrics(healthCheck) {
  metrics.lastCheckTimestamp.set(Date.now() / 1000);
  metrics.ipMatchStatus.set(healthCheck.isCurrentIpEqualToDnsIp ? 1 : 0);
  metrics.dnsCheckSuccess.set(healthCheck.isLastCheckRecent ? 1 : 0);
}

module.exports = {
  register,
  metrics,
  updateMetrics,
};
