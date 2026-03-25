import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../utils/config.js";
import {
  getTodayDateStr,
  readTaskFile,
  taskFileExists,
  createNewTaskFile,
  getCarryoverTasks,
  addTaskToFile,
} from "../utils/task-file.js";

const AddTaskSchema = {
  task: z.string().describe("The task description"),
  due: z
    .string()
    .optional()
    .describe("Due date in YYYY-MM-DD format"),
  tags: z
    .array(z.string())
    .optional()
    .describe("Tags for the task (e.g., #project, @person)"),
};

export function registerAddTool(server: McpServer, config: Config): void {
  server.tool(
    "dbd_add",
    "Add a new task to today's task file",
    AddTaskSchema,
    async (args) => {
      const { task, due, tags } = args;
      const dateStr = getTodayDateStr();

      // Ensure today's file exists
      if (!taskFileExists(config, dateStr)) {
        const carryover = getCarryoverTasks(config, dateStr);
        createNewTaskFile(config, dateStr, carryover);
      }

      // Build the full task text
      let taskText = task;

      // Add tags if provided
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          // Ensure tags start with # or @
          if (!tag.startsWith("#") && !tag.startsWith("@")) {
            taskText += ` #${tag}`;
          } else {
            taskText += ` ${tag}`;
          }
        }
      }

      // Add due date if provided
      if (due) {
        taskText += ` due:${due}`;
      }

      const result = addTaskToFile(config, dateStr, taskText);

      if (!result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Could not add task to ${dateStr}`,
            },
          ],
        };
      }

      const taskFile = readTaskFile(config, dateStr);
      const totalTasks = taskFile?.tasks.length || 0;

      const response = `Task added successfully!

## Added Task
- [ ] ${taskText}

## Summary
- Date: ${dateStr}
- Total tasks today: ${totalTasks}`;

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
