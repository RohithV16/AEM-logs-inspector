export const ALLOWED_LOG_EXTENSIONS = ['.log', '.gz'];

export function isLogFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  // Strictly allow only .log and .gz. Exclude index.json and others.
  return ALLOWED_LOG_EXTENSIONS.some(ext => lower.endsWith(ext)) && !lower.includes('index.json');
}
