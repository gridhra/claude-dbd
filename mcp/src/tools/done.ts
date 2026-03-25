import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../utils/config.js";
import {
  getTodayDateStr,
  readTaskFile,
  completeTask,
} from "../utils/task-file.js";

const DoneTaskSchema = {
  taskIndex: z.number().describe("The task number to mark as complete (1-based index)"),
  accomplishment: z
    .string()
    .optional()
    .describe("Description of what was accomplished"),
};

export function registerDoneTool(server: McpServer, config: Config): void {
  server.tool(
    "dbd_done",
    "Mark a task as complete and optionally record an accomplishment",
    DoneTaskSchema,
    async (args) => {
      const { taskIndex, accomplishment } = args;
      const dateStr = getTodayDateStr();

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

      const task = taskFile.tasks.find((t) => t.index === taskIndex);
      if (!task) {
        const validIndices = taskFile.tasks.map((t) => t.index).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Task #${taskIndex} not found. Valid task numbers: ${validIndices}`,
            },
          ],
        };
      }

      if (task.completed) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Task #${taskIndex} is already completed: ${task.text}`,
            },
          ],
        };
      }

      const result = completeTask(config, dateStr, taskIndex, accomplishment);

      if (!result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Could not complete task #${taskIndex}`,
            },
          ],
        };
      }

      const updatedFile = readTaskFile(config, dateStr);
      const incompleteTasks =
        updatedFile?.tasks.filter((t) => !t.completed) || [];
      const completedTasks =
        updatedFile?.tasks.filter((t) => t.completed) || [];

      const response = `Task completed!

## Completed Task
- [x] ${task.text} _done:${dateStr}
${accomplishment ? `\n## Accomplishment Recorded\n- ${accomplishment}` : ""}

## Summary
- Date: ${dateStr}
- Completed today: ${completedTasks.length}
- Remaining: ${incompleteTasks.length}`;

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
