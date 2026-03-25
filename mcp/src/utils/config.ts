export interface Config {
  dbdRoot: string;
  tasksDir: string;
  reportsDir: string;
}

export function getConfig(): Config {
  const dbdRoot = process.env.DBD_ROOT;
  if (!dbdRoot) {
    throw new Error("DBD_ROOT environment variable is not set");
  }
  return {
    dbdRoot,
    tasksDir: `${dbdRoot}/tasks`,
    reportsDir: `${dbdRoot}/reports`,
  };
}
