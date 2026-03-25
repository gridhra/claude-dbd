import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../utils/config.js";
import {
  getTodayDateStr,
  readTaskFile,
  generateDailyReport,
  formatDailyReportMarkdown,
} from "../utils/task-file.js";

const ReportSchema = {
  date: z
    .string()
    .optional()
    .describe("Date for the report in YYYY-MM-DD format (defaults to today)"),
};

export function registerReportTool(server: McpServer, config: Config): void {
  server.tool(
    "dbd_report",
    "Generate a daily report summarizing tasks and activities",
    ReportSchema,
    async (args) => {
      const dateStr = args.date || getTodayDateStr();

      const taskFile = readTaskFile(config, dateStr);
      if (!taskFile) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: No task file found for ${dateStr}. Use dbd_today to create one.`,
            },
          ],
        };
      }

      const report = generateDailyReport(config, dateStr);
      if (!report) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Could not generate report for ${dateStr}`,
            },
          ],
        };
      }

      const markdown = formatDailyReportMarkdown(report);

      return {
        content: [
          {
            type: "text" as const,
            text: markdown,
          },
        ],
      };
    }
  );
}
