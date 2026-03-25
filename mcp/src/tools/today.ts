import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../utils/config.js";
import {
  getTodayDateStr,
  readTaskFile,
  taskFileExists,
  createNewTaskFile,
  getCarryoverTasks,
  getHandoffSection,
  findPreviousTaskFileDate,
} from "../utils/task-file.js";

export function registerTodayTool(server: McpServer, config: Config): void {
  server.tool(
    "dbd_today",
    "Get today's task list and summary. Creates the daily file if it doesn't exist.",
    {},
    async () => {
      const dateStr = getTodayDateStr();

      let content: string;
      let isNewFile = false;

      if (!taskFileExists(config, dateStr)) {
        const carryover = getCarryoverTasks(config, dateStr);
        content = createNewTaskFile(config, dateStr, carryover);
        isNewFile = true;
      } else {
        const taskFile = readTaskFile(config, dateStr);
        if (!taskFile) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Could not read task file for ${dateStr}`,
              },
            ],
          };
        }
        content = taskFile.content;
      }

      const taskFile = readTaskFile(config, dateStr);
      const incompleteTasks = taskFile?.tasks.filter((t) => !t.completed) || [];
      const completedTasks = taskFile?.tasks.filter((t) => t.completed) || [];

      const summary = {
        date: dateStr,
        isNewFile,
        totalTasks: taskFile?.tasks.length || 0,
        incompleteTasks: incompleteTasks.length,
        completedTasks: completedTasks.length,
        doneItems: taskFile?.doneItems.length || 0,
      };

      const taskList = incompleteTasks
        .map((t) => `${t.index}. [ ] ${t.text}`)
        .join("\n");

      // Get previous day's handoff section
      let handoffSection = "";
      const prevDateStr = findPreviousTaskFileDate(config, dateStr);
      if (prevDateStr) {
        const prevHandoff = getHandoffSection(config, prevDateStr);
        if (prevHandoff) {
          handoffSection = `## Previous Handoff (${prevDateStr})
${prevHandoff}

---

`;
        }
      }

      const response = `# Today's Tasks (${dateStr})

${handoffSection}## Summary
- Total tasks: ${summary.totalTasks}
- Incomplete: ${summary.incompleteTasks}
- Completed: ${summary.completedTasks}
${isNewFile ? "- Status: New daily file created\n" : ""}
## Incomplete Tasks
${taskList || "(No incomplete tasks)"}

## Raw File Content
\`\`\`markdown
${content}
\`\`\``;

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
