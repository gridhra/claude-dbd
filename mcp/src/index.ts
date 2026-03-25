import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAddTool } from "./tools/add.js";
import { registerDoneTool } from "./tools/done.js";
import { registerLogTool } from "./tools/log.js";
import { registerNoteTool } from "./tools/note.js";
import { registerReportTool } from "./tools/report.js";
import { registerTodayTool } from "./tools/today.js";
import { getConfig } from "./utils/config.js";

// Validate configuration at startup
const config = getConfig();
console.error(`dbd-mcp-server: DBD_ROOT=${config.dbdRoot}`);

const server = new McpServer({
  name: "dbd-mcp-server",
  version: "1.0.0",
});

// Register tools
registerTodayTool(server, config);
registerAddTool(server, config);
registerDoneTool(server, config);
registerLogTool(server, config);
registerNoteTool(server, config);
registerReportTool(server, config);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("dbd-mcp-server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
