const http = require("http");
const {
  checkEnvironmentVariables,
  performDnsCheck,
  lastRun,
} = require("./helpers/dns");
const { generateHealthCheckResponse } = require("./helpers/health-checks");
const { register, metrics, updateMetrics } = require("./helpers/metrics");

const PORT = process.env.PORT || 3000;

// Check environment variables
checkEnvironmentVariables();

// Schedule DNS check every minute
setInterval(async () => {
  const result = await performDnsCheck();
  if (result.updated) {
    metrics.dnsUpdates.inc();
  }
  if (!result.success) {
    metrics.dnsErrors.inc();
  }
}, 60000);

// Create server
const server = http.createServer(async (req, res) => {
  if (req.url === "/metrics") {
    try {
      // Update metrics with latest health check data
      const healthCheck = await generateHealthCheckResponse(lastRun);
      updateMetrics(healthCheck);

      // Get all metrics
      const metrics = await register.metrics();

      res.writeHead(200, { "Content-Type": register.contentType });
      res.end(metrics);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(err.message);
    }
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
