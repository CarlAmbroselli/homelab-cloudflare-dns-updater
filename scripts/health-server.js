const http = require("http");
const fs = require("fs").promises;

const PORT = process.env.PORT || 3000;

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

const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    const lastRun = await readLastRunJson();

    if (lastRun) {
      const statusCode = lastRun.success ? 200 : 500;
      const recentTimestamp = isTimestampRecent(lastRun.timestamp);

      const responseData = {
        ...lastRun,
        recentTimestamp,
      };

      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify(responseData, null, 2));
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("last_run.json not found or invalid");
    }
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
