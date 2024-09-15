const http = require("http");
const { checkEnvironmentVariables, performDnsCheck } = require("./helpers/dns");
const { generateHealthCheckResponse } = require("./helpers/health-checks");

const PORT = process.env.PORT || 3000;

// Check environment variables
checkEnvironmentVariables();

// Schedule DNS check every minute
setInterval(performDnsCheck, 60000);

// Create server
const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    const healthCheckResponse = await generateHealthCheckResponse();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(healthCheckResponse, null, 2));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
