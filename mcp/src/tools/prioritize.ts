import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../utils/config.js";
import {
  getTodayDateStr,
  readTaskFile,
  taskFileExists,
  createNewTaskFile,
  getCarryoverTasks,
  type Task,
} from "../utils/task-file.js";
import {
  countBusinessDays,
  estimateEffort,
  estimateImpact,
  calculatePriorityScore,
  getPriorityLabel,
  type TaskPriorityInfo,
} from "../utils/business-days.js";

function parseEffortImpact(text: string): { effort: string | null; impact: string | null } {
  const effortMatch = text.match(/effort:([SMLX]+)/i);
  const impactMatch = text.match(/impact:([LMHC])/i);
  return {
    effort: effortMatch ? effortMatch[1].toUpperCase() : null,
    impact: impactMatch ? impactMatch[1].toUpperCase() : null,
  };
}

function analyzeTasks(config: Config, tasks: Task[]): TaskPriorityInfo[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks
    .filter((t) => !t.completed)
    .map((task) => {
      const { effort, impact } = parseEffortImpact(task.text);
      const estimatedEffortVal = effort ? null : estimateEffort(task.text);
      const estimatedImpactVal = impact ? null : estimateImpact(task.text);

      let calendarDaysRemaining: number | null = null;
      let businessDaysRemaining: number | null = null;

      if (task.due) {
        const dueDate = new Date(task.due);
        dueDate.setHours(0, 0, 0, 0);
        calendarDaysRemaining = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        businessDaysRemaining = countBusinessDays(config, today, dueDate);
      }

      const effectiveEffort = effort || estimatedEffortVal;
      const effectiveImpact = impact || estimatedImpactVal;

      const priorityScore = calculatePriorityScore(
        businessDaysRemaining,
        effectiveEffort,
        effectiveImpact
      );

      return {
        taskText: task.text,
        dueDate: task.due,
        calendarDaysRemaining,
        businessDaysRemaining,
        effort,
        impact,
        estimatedEffort: estimatedEffortVal,
        estimatedImpact: estimatedImpactVal,
        priorityScore,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function registerPrioritizeTool(server: McpServer, config: Config): void {
  server.tool(
    "dbd_prioritize",
    "Analyze tasks and suggest priorities based on due dates (business days), effort, and impact",
    {},
    async () => {
      const dateStr = getTodayDateStr();

      // Ensure today's file exists
      if (!taskFileExists(config, dateStr)) {
        const carryover = getCarryoverTasks(config, dateStr);
        createNewTaskFile(config, dateStr, carryover);
      }

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

      const prioritizedTasks = analyzeTasks(config, taskFile.tasks);

      if (prioritizedTasks.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No incomplete tasks found for ${dateStr}.`,
            },
          ],
        };
      }

      // Build response
      const lines: string[] = [];
      lines.push(`# タスク優先度分析 (${dateStr})`);
      lines.push("");

      // Prioritized task list
      lines.push("## 優先度順タスク一覧");
      lines.push("");
      lines.push("| 優先度 | タスク | 期限 | 営業日残 | effort | impact |");
      lines.push("|:------:|--------|------|:--------:|:------:|:------:|");

      for (const task of prioritizedTasks) {
        const priority = getPriorityLabel(task.priorityScore);
        const dueStr = task.dueDate || "-";
        const bizDays = task.businessDaysRemaining !== null ? `${task.businessDaysRemaining}日` : "-";

        // Show effort/impact with estimation indicator
        let effortStr = task.effort || task.estimatedEffort || "?";
        if (!task.effort && task.estimatedEffort) {
          effortStr = `${task.estimatedEffort}*`;
        }

        let impactStr = task.impact || task.estimatedImpact || "?";
        if (!task.impact && task.estimatedImpact) {
          impactStr = `${task.estimatedImpact}*`;
        }

        // Truncate long task text
        let taskText = task.taskText;
        // Remove tags for display
        taskText = taskText.replace(/\s*(effort|impact|due):\S+/gi, "").trim();
        if (taskText.length > 40) {
          taskText = taskText.substring(0, 37) + "...";
        }

        lines.push(`| ${priority.split(" ")[0]} | ${taskText} | ${dueStr} | ${bizDays} | ${effortStr} | ${impactStr} |`);
      }

      lines.push("");
      lines.push("*\\* = AI推定値（確定していません）*");
      lines.push("");

      // Tasks needing clarification
      const needsClarification = prioritizedTasks.filter(
        (t) => (!t.effort && !t.estimatedEffort) || (!t.impact && !t.estimatedImpact)
      );

      if (needsClarification.length > 0) {
        lines.push("## 情報が不足しているタスク");
        lines.push("");
        for (const task of needsClarification) {
          const missing: string[] = [];
          if (!task.effort && !task.estimatedEffort) missing.push("effort");
          if (!task.impact && !task.estimatedImpact) missing.push("impact");
          lines.push(`- ${task.taskText.substring(0, 50)}...`);
          lines.push(`  → 不明: ${missing.join(", ")}`);
        }
        lines.push("");
      }

      // Today's recommendation
      lines.push("## 今日の推奨アクション");
      lines.push("");

      const topTasks = prioritizedTasks.slice(0, 3);
      if (topTasks.length > 0) {
        for (let i = 0; i < topTasks.length; i++) {
          const task = topTasks[i];
          let taskText = task.taskText.replace(/\s*(effort|impact|due):\S+/gi, "").trim();
          if (taskText.length > 60) {
            taskText = taskText.substring(0, 57) + "...";
          }
          const urgency = task.businessDaysRemaining !== null && task.businessDaysRemaining <= 2
            ? " ⚠️"
            : "";
          lines.push(`${i + 1}. **${taskText}**${urgency}`);
          if (task.businessDaysRemaining !== null) {
            lines.push(`   - 営業日残: ${task.businessDaysRemaining}日`);
          }
        }
      }

      lines.push("");
      lines.push("---");
      lines.push("effort: S(数時間) / M(1日) / L(数日) / XL(1週間+)");
      lines.push("impact: L(低) / M(中) / H(高) / C(クリティカル)");

      return {
        content: [
          {
            type: "text" as const,
            text: lines.join("\n"),
          },
        ],
      };
    }
  );
}
