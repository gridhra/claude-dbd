import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../utils/config.js";
import {
  getTodayDateStr,
  taskFileExists,
  createNewTaskFile,
  getCarryoverTasks,
  getCurrentTimeStr,
  addHandoffEntry,
  addNoteEntry,
} from "../utils/task-file.js";

const NoteSchema = {
  type: z
    .enum(["handoff", "note"])
    .nullable()
    .optional()
    .describe("Type of entry: 'handoff' for handoff section, 'note' for notes section, null for auto-detect"),
  thoughts: z
    .string()
    .optional()
    .describe("Thoughts/reflections on today (for handoff)"),
  context: z
    .string()
    .optional()
    .describe("Context/handoff information for tomorrow (for handoff)"),
  priority: z
    .string()
    .optional()
    .describe("Priority for tomorrow (for handoff)"),
  content: z
    .string()
    .optional()
    .describe("Free text content (for notes, or auto-detect)"),
};

// Keywords that suggest handoff content
const HANDOFF_KEYWORDS = [
  "明日",
  "次回",
  "引き継ぎ",
  "優先",
  "tomorrow",
  "next",
  "handoff",
  "priority",
  "続き",
  "継続",
];

function isHandoffContent(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return HANDOFF_KEYWORDS.some(
    (keyword) =>
      lowerContent.includes(keyword.toLowerCase()) ||
      content.includes(keyword)
  );
}

export function registerNoteTool(server: McpServer, config: Config): void {
  server.tool(
    "dbd_note",
    "Record notes or handoff items. Routes to Notes or Handoff section based on type or content analysis.",
    NoteSchema,
    async (args) => {
      const { type, thoughts, context, priority, content } = args;
      const dateStr = getTodayDateStr();
      const timestamp = getCurrentTimeStr();

      // Ensure today's file exists
      if (!taskFileExists(config, dateStr)) {
        const carryover = getCarryoverTasks(config, dateStr);
        createNewTaskFile(config, dateStr, carryover);
      }

      // Determine entry type
      let entryType: "handoff" | "note" = "note";

      if (type) {
        entryType = type;
      } else if (thoughts || context || priority) {
        // If any handoff fields are provided, it's a handoff entry
        entryType = "handoff";
      } else if (content) {
        // Auto-detect based on content
        entryType = isHandoffContent(content) ? "handoff" : "note";
      }

      if (entryType === "handoff") {
        // Handle handoff entry
        const handoffThoughts = thoughts || (content && isHandoffContent(content) ? undefined : undefined);
        const handoffContext = context || (content && isHandoffContent(content) ? content : undefined);
        const handoffPriority = priority;

        // Validate that at least one field is provided
        if (!handoffThoughts && !handoffContext && !handoffPriority) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: At least one of thoughts, context, or priority must be provided for handoff entry.",
              },
            ],
          };
        }

        const result = addHandoffEntry(config, dateStr, {
          timestamp,
          thoughts: handoffThoughts,
          context: handoffContext,
          priority: handoffPriority,
        });

        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Could not add handoff entry to ${dateStr}`,
              },
            ],
          };
        }

        const parts: string[] = [];
        if (handoffThoughts) parts.push(`- Thoughts: ${handoffThoughts}`);
        if (handoffContext) parts.push(`- Context: ${handoffContext}`);
        if (handoffPriority) parts.push(`- Priority: ${handoffPriority}`);

        const response = `Recorded handoff at ${timestamp}:
${parts.join("\n")}

Date: ${dateStr}`;

        return {
          content: [
            {
              type: "text" as const,
              text: response,
            },
          ],
        };
      } else {
        // Handle note entry
        if (!content) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: Content is required for note entry.",
              },
            ],
          };
        }

        const result = addNoteEntry(config, dateStr, timestamp, content);

        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Could not add note entry to ${dateStr}`,
              },
            ],
          };
        }

        const response = `Noted at ${timestamp}:
- ${content}

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
    }
  );
}
