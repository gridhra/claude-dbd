import * as fs from "node:fs";
import * as path from "node:path";
import type { Config } from "./config.js";

export interface TaskFile {
  date: string;
  weekday: string;
  prev: string;
  content: string;
  tasks: Task[];
  doneItems: string[];
}

export interface Task {
  index: number;
  text: string;
  completed: boolean;
  tags: string[];
  due?: string;
  doneDate?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getTodayDateStr(): string {
  const now = new Date();
  return formatDate(now);
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekday(dateStr: string): string {
  const date = new Date(dateStr);
  return WEEKDAYS[date.getDay()];
}

export function getTaskFilePath(config: Config, dateStr: string): string {
  const [year, month] = dateStr.split("-");
  return path.join(config.tasksDir, year, month, `${dateStr}.md`);
}

export function taskFileExists(config: Config, dateStr: string): boolean {
  const filePath = getTaskFilePath(config, dateStr);
  return fs.existsSync(filePath);
}

export function readTaskFile(config: Config, dateStr: string): TaskFile | null {
  const filePath = getTaskFilePath(config, dateStr);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return parseTaskFile(content, dateStr);
}

function parseTaskFile(content: string, dateStr: string): TaskFile {
  const lines = content.split("\n");
  const tasks: Task[] = [];
  const doneItems: string[] = [];

  let frontmatter = { date: dateStr, weekday: getWeekday(dateStr), prev: "" };
  let inFrontmatter = false;
  let currentSection = "";
  let taskIndex = 1;

  for (const line of lines) {
    if (line === "---") {
      inFrontmatter = !inFrontmatter;
      continue;
    }

    if (inFrontmatter) {
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        if (key === "date") frontmatter.date = value;
        if (key === "weekday") frontmatter.weekday = value;
        if (key === "prev") frontmatter.prev = value;
      }
      continue;
    }

    if (line.startsWith("## ")) {
      currentSection = line.slice(3).trim();
      continue;
    }

    if (currentSection === "Tasks" || currentSection === "Carryover") {
      const taskMatch = line.match(/^- \[([ x])\] (.+)$/);
      if (taskMatch) {
        const [, checkmark, text] = taskMatch;
        const completed = checkmark === "x";
        const task = parseTaskLine(text, taskIndex, completed);
        tasks.push(task);
        taskIndex++;
      }
    }

    if (currentSection === "Done") {
      const doneMatch = line.match(/^- (.+)$/);
      if (doneMatch) {
        doneItems.push(doneMatch[1]);
      }
    }
  }

  return {
    date: frontmatter.date,
    weekday: frontmatter.weekday,
    prev: frontmatter.prev,
    content,
    tasks,
    doneItems,
  };
}

function parseTaskLine(
  text: string,
  index: number,
  completed: boolean
): Task {
  const tags: string[] = [];
  let due: string | undefined;
  let doneDate: string | undefined;

  // Extract #tags
  const tagMatches = text.matchAll(/#(\w+)/g);
  for (const match of tagMatches) {
    tags.push(`#${match[1]}`);
  }

  // Extract @mentions as tags too
  const mentionMatches = text.matchAll(/@(\w+)/g);
  for (const match of mentionMatches) {
    tags.push(`@${match[1]}`);
  }

  // Extract due date
  const dueMatch = text.match(/due:(\d{4}-\d{2}-\d{2})/);
  if (dueMatch) {
    due = dueMatch[1];
  }

  // Extract done date
  const doneMatch = text.match(/_done:(\d{4}-\d{2}-\d{2})/);
  if (doneMatch) {
    doneDate = doneMatch[1];
  }

  return {
    index,
    text,
    completed,
    tags,
    due,
    doneDate,
  };
}

export function writeTaskFile(
  config: Config,
  dateStr: string,
  content: string
): void {
  const filePath = getTaskFilePath(config, dateStr);
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, content, "utf-8");
}

export function createNewTaskFile(
  config: Config,
  dateStr: string,
  carryoverTasks: string[] = []
): string {
  const weekday = getWeekday(dateStr);
  const prevFile = findPreviousTaskFile(config, dateStr);

  const carryoverSection =
    carryoverTasks.length > 0
      ? carryoverTasks.join("\n")
      : "<!-- 引き継ぎタスクなし -->";

  const content = `---
date: ${dateStr}
weekday: ${weekday}
prev: ${prevFile || ""}
---

# ${dateStr} (${weekday})

## Carryover
${carryoverSection}

## Tasks
- [ ]

## Done
<!-- 成果をここに記録 -->

## Handoff
<!-- 所感・引き継ぎ・明日の優先 -->

## Notes
<!-- ブロッカー、アイデア、メモ -->
`;

  writeTaskFile(config, dateStr, content);
  return content;
}

function findPreviousTaskFile(
  config: Config,
  currentDateStr: string
): string | null {
  const currentDate = new Date(currentDateStr);

  // Look back up to 30 days
  for (let i = 1; i <= 30; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - i);
    const prevDateStr = formatDate(prevDate);

    if (taskFileExists(config, prevDateStr)) {
      return prevDateStr;
    }
  }

  return null;
}

export function getCarryoverTasks(config: Config, dateStr: string): string[] {
  const prevDateStr = findPreviousTaskFile(config, dateStr);
  if (!prevDateStr) {
    return [];
  }

  const prevFile = readTaskFile(config, prevDateStr);
  if (!prevFile) {
    return [];
  }

  return prevFile.tasks
    .filter((task) => !task.completed)
    .map((task) => `- [ ] ${task.text}`);
}

export function addTaskToFile(
  config: Config,
  dateStr: string,
  taskText: string
): { success: boolean; content: string; taskCount: number } {
  const taskFile = readTaskFile(config, dateStr);
  if (!taskFile) {
    return { success: false, content: "", taskCount: 0 };
  }

  const lines = taskFile.content.split("\n");
  const newLines: string[] = [];
  let inTasksSection = false;
  let tasksInserted = false;
  let taskCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === "## Tasks") {
      inTasksSection = true;
      newLines.push(line);
      continue;
    }

    if (inTasksSection && line.startsWith("## ")) {
      // Entering a new section, insert task before this if not already
      if (!tasksInserted) {
        newLines.push(`- [ ] ${taskText}`);
        tasksInserted = true;
        taskCount++;
      }
      inTasksSection = false;
    }

    if (inTasksSection && line.match(/^- \[[ x]\]/)) {
      taskCount++;
    }

    // Replace empty task placeholder
    if (inTasksSection && line === "- [ ] " && !tasksInserted) {
      newLines.push(`- [ ] ${taskText}`);
      tasksInserted = true;
      taskCount++;
      continue;
    }

    newLines.push(line);
  }

  // If we're still in tasks section at end of file
  if (inTasksSection && !tasksInserted) {
    newLines.push(`- [ ] ${taskText}`);
    taskCount++;
  }

  const newContent = newLines.join("\n");
  writeTaskFile(config, dateStr, newContent);

  return { success: true, content: newContent, taskCount };
}

export function completeTask(
  config: Config,
  dateStr: string,
  taskIndex: number,
  accomplishment?: string
): { success: boolean; task?: Task; content: string } {
  const taskFile = readTaskFile(config, dateStr);
  if (!taskFile) {
    return { success: false, content: "" };
  }

  const task = taskFile.tasks.find((t) => t.index === taskIndex);
  if (!task) {
    return { success: false, content: taskFile.content };
  }

  if (task.completed) {
    return { success: false, content: taskFile.content, task };
  }

  const lines = taskFile.content.split("\n");
  const newLines: string[] = [];
  let currentTaskIndex = 0;
  let inTasksSection = false;
  let inCarryoverSection = false;
  let inDoneSection = false;
  let doneInserted = false;

  for (const line of lines) {
    if (line === "## Tasks") {
      inTasksSection = true;
      inCarryoverSection = false;
      inDoneSection = false;
    } else if (line === "## Carryover") {
      inCarryoverSection = true;
      inTasksSection = false;
      inDoneSection = false;
    } else if (line === "## Done") {
      inDoneSection = true;
      inTasksSection = false;
      inCarryoverSection = false;
    } else if (line.startsWith("## ")) {
      inTasksSection = false;
      inCarryoverSection = false;
      inDoneSection = false;
    }

    if ((inTasksSection || inCarryoverSection) && line.match(/^- \[[ x]\]/)) {
      currentTaskIndex++;
      if (currentTaskIndex === taskIndex) {
        // Mark as complete
        const newLine = line
          .replace("- [ ]", "- [x]")
          .replace(/\s*$/, ` _done:${dateStr}`);
        newLines.push(newLine);
        continue;
      }
    }

    // Add accomplishment to Done section
    if (inDoneSection && accomplishment && !doneInserted) {
      if (line.startsWith("<!--") || line === "") {
        newLines.push(`- ${accomplishment}`);
        doneInserted = true;
      }
    }

    newLines.push(line);
  }

  const newContent = newLines.join("\n");
  writeTaskFile(config, dateStr, newContent);

  return {
    success: true,
    task: { ...task, completed: true, doneDate: dateStr },
    content: newContent,
  };
}

export function getCurrentTimeStr(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function addLogEntry(
  config: Config,
  dateStr: string,
  activity: string
): { success: boolean; timestamp: string; content: string } {
  const taskFile = readTaskFile(config, dateStr);
  if (!taskFile) {
    return { success: false, timestamp: "", content: "" };
  }

  const timestamp = getCurrentTimeStr();
  const logEntry = `- ${timestamp} ${activity}`;

  const lines = taskFile.content.split("\n");
  const newLines: string[] = [];
  let inDoneSection = false;
  let logInserted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === "## Done") {
      inDoneSection = true;
      newLines.push(line);
      continue;
    }

    if (inDoneSection && line.startsWith("## ")) {
      // Entering a new section, insert log before this if not already
      if (!logInserted) {
        newLines.push(logEntry);
        logInserted = true;
      }
      inDoneSection = false;
    }

    // Insert after comment or at first empty line in Done section
    if (inDoneSection && !logInserted) {
      if (line.startsWith("<!--") && line.includes("-->")) {
        newLines.push(line);
        newLines.push(logEntry);
        logInserted = true;
        continue;
      }
    }

    newLines.push(line);
  }

  // If we're still in done section at end of file
  if (inDoneSection && !logInserted) {
    newLines.push(logEntry);
  }

  const newContent = newLines.join("\n");
  writeTaskFile(config, dateStr, newContent);

  return { success: true, timestamp, content: newContent };
}

export interface DailyReport {
  date: string;
  weekday: string;
  completedTasks: Task[];
  incompleteTasks: Task[];
  doneItems: string[];
  notes: string[];
  summary: {
    totalTasks: number;
    completed: number;
    incomplete: number;
    completionRate: number;
  };
}

export function generateDailyReport(
  config: Config,
  dateStr: string
): DailyReport | null {
  const taskFile = readTaskFile(config, dateStr);
  if (!taskFile) {
    return null;
  }

  // Parse notes section
  const notes: string[] = [];
  const lines = taskFile.content.split("\n");
  let inNotesSection = false;

  for (const line of lines) {
    if (line === "## Notes") {
      inNotesSection = true;
      continue;
    }
    if (inNotesSection && line.startsWith("## ")) {
      inNotesSection = false;
    }
    if (inNotesSection) {
      const noteMatch = line.match(/^- (.+)$/);
      if (noteMatch) {
        notes.push(noteMatch[1]);
      }
    }
  }

  const completedTasks = taskFile.tasks.filter((t) => t.completed);
  const incompleteTasks = taskFile.tasks.filter((t) => !t.completed);
  const totalTasks = taskFile.tasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  return {
    date: taskFile.date,
    weekday: taskFile.weekday,
    completedTasks,
    incompleteTasks,
    doneItems: taskFile.doneItems,
    notes,
    summary: {
      totalTasks,
      completed: completedTasks.length,
      incomplete: incompleteTasks.length,
      completionRate,
    },
  };
}

export interface HandoffEntry {
  timestamp: string;
  thoughts?: string;
  context?: string;
  priority?: string;
}

export function addHandoffEntry(
  config: Config,
  dateStr: string,
  entry: HandoffEntry
): { success: boolean; timestamp: string; content: string } {
  const taskFile = readTaskFile(config, dateStr);
  if (!taskFile) {
    return { success: false, timestamp: "", content: "" };
  }

  const lines = taskFile.content.split("\n");
  const newLines: string[] = [];
  let inHandoffSection = false;
  let entryInserted = false;

  // Build the entry content
  const entryLines: string[] = [];
  entryLines.push(`### ${entry.timestamp}`);
  if (entry.thoughts) {
    entryLines.push("#### 所感");
    entryLines.push(`- ${entry.thoughts}`);
  }
  if (entry.context) {
    entryLines.push("#### 引き継ぎ");
    entryLines.push(`- ${entry.context}`);
  }
  if (entry.priority) {
    entryLines.push("#### 明日の優先");
    entryLines.push(`- ${entry.priority}`);
  }
  entryLines.push("");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === "## Handoff") {
      inHandoffSection = true;
      newLines.push(line);
      continue;
    }

    if (inHandoffSection && line.startsWith("## ")) {
      // Entering a new section, insert entry before this if not already
      if (!entryInserted) {
        newLines.push(...entryLines);
        entryInserted = true;
      }
      inHandoffSection = false;
    }

    // Insert after comment in Handoff section
    if (inHandoffSection && !entryInserted) {
      if (line.startsWith("<!--") && line.includes("-->")) {
        newLines.push(line);
        newLines.push(...entryLines);
        entryInserted = true;
        continue;
      }
    }

    newLines.push(line);
  }

  // If we're still in handoff section at end of file
  if (inHandoffSection && !entryInserted) {
    newLines.push(...entryLines);
  }

  const newContent = newLines.join("\n");
  writeTaskFile(config, dateStr, newContent);

  return { success: true, timestamp: entry.timestamp, content: newContent };
}

export function addNoteEntry(
  config: Config,
  dateStr: string,
  timestamp: string,
  content: string
): { success: boolean; timestamp: string; content: string } {
  const taskFile = readTaskFile(config, dateStr);
  if (!taskFile) {
    return { success: false, timestamp: "", content: "" };
  }

  const noteEntry = `- ${timestamp} ${content}`;
  const lines = taskFile.content.split("\n");
  const newLines: string[] = [];
  let inNotesSection = false;
  let noteInserted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === "## Notes") {
      inNotesSection = true;
      newLines.push(line);
      continue;
    }

    if (inNotesSection && line.startsWith("## ")) {
      // Entering a new section, insert note before this if not already
      if (!noteInserted) {
        newLines.push(noteEntry);
        noteInserted = true;
      }
      inNotesSection = false;
    }

    // Insert after comment in Notes section
    if (inNotesSection && !noteInserted) {
      if (line.startsWith("<!--") && line.includes("-->")) {
        newLines.push(line);
        newLines.push(noteEntry);
        noteInserted = true;
        continue;
      }
    }

    newLines.push(line);
  }

  // If we're still in notes section at end of file
  if (inNotesSection && !noteInserted) {
    newLines.push(noteEntry);
  }

  const newContent = newLines.join("\n");
  writeTaskFile(config, dateStr, newContent);

  return { success: true, timestamp, content: newContent };
}

export function getHandoffSection(
  config: Config,
  dateStr: string
): string | null {
  const taskFile = readTaskFile(config, dateStr);
  if (!taskFile) {
    return null;
  }

  const lines = taskFile.content.split("\n");
  const handoffLines: string[] = [];
  let inHandoffSection = false;

  for (const line of lines) {
    if (line === "## Handoff") {
      inHandoffSection = true;
      continue;
    }
    if (inHandoffSection && line.startsWith("## ")) {
      break;
    }
    if (inHandoffSection) {
      // Skip comments
      if (line.startsWith("<!--") && line.includes("-->")) {
        continue;
      }
      if (line.trim() !== "") {
        handoffLines.push(line);
      }
    }
  }

  if (handoffLines.length === 0) {
    return null;
  }

  return handoffLines.join("\n");
}

export function findPreviousTaskFileDate(
  config: Config,
  currentDateStr: string
): string | null {
  const currentDate = new Date(currentDateStr);

  // Look back up to 30 days
  for (let i = 1; i <= 30; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - i);
    const prevDateStr = formatDate(prevDate);

    if (taskFileExists(config, prevDateStr)) {
      return prevDateStr;
    }
  }

  return null;
}

export function formatDailyReportMarkdown(report: DailyReport): string {
  const lines: string[] = [];

  lines.push(`# 日報 ${report.date} (${report.weekday})`);
  lines.push("");

  // Summary
  lines.push("## サマリー");
  lines.push("");
  lines.push(`- タスク総数: ${report.summary.totalTasks}`);
  lines.push(`- 完了: ${report.summary.completed}`);
  lines.push(`- 未完了: ${report.summary.incomplete}`);
  lines.push(`- 達成率: ${report.summary.completionRate}%`);
  lines.push("");

  // Completed tasks
  lines.push("## 完了したタスク");
  lines.push("");
  if (report.completedTasks.length > 0) {
    for (const task of report.completedTasks) {
      lines.push(`- ${task.text}`);
    }
  } else {
    lines.push("（なし）");
  }
  lines.push("");

  // Activity log
  lines.push("## 活動ログ");
  lines.push("");
  if (report.doneItems.length > 0) {
    for (const item of report.doneItems) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push("（記録なし）");
  }
  lines.push("");

  // Remaining tasks
  lines.push("## 残タスク");
  lines.push("");
  if (report.incompleteTasks.length > 0) {
    for (const task of report.incompleteTasks) {
      const dueInfo = task.due ? ` (期限: ${task.due})` : "";
      lines.push(`- ${task.text}${dueInfo}`);
    }
  } else {
    lines.push("（なし）");
  }
  lines.push("");

  // Notes
  if (report.notes.length > 0) {
    lines.push("## メモ・備考");
    lines.push("");
    for (const note of report.notes) {
      lines.push(`- ${note}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
