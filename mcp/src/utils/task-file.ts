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

function formatDate(date: Date): string {
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
