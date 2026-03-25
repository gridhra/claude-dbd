import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../utils/config.js";
import {
  getTodayDateStr,
  taskFileExists,
  createNewTaskFile,
  getCarryoverTasks,
  addLogEntry,
} from "../utils/task-file.js";

const LogSchema = {
  activity: z.string().describe("The activity description to log"),
};

export function registerLogTool(server: McpServer, config: Config): void {
  server.tool(
    "dbd_log",
    "Log an activity with timestamp to today's Done section",
    LogSchema,
    async (args) => {
      const { activity } = args;
      const dateStr = getTodayDateStr();

      // Ensure today's file exists
      if (!taskFileExists(config, dateStr)) {
        const carryover = getCarryoverTasks(config, dateStr);
        createNewTaskFile(config, dateStr, carryover);
      }

      const result = addLogEntry(config, dateStr, activity);

      if (!result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Could not add log entry to ${dateStr}`,
            },
          ],
        };
      }

      const response = `Logged at ${result.timestamp}:
- ${activity}

Date: ${dateStr}`;

      return {
        content: [
          {
            type: "text" as const,
            text: response,
          },
        ],
      };
    }
  );
}
