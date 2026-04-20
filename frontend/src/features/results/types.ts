export interface LogEvent {
  id?: string;
  timestamp: string;
  level?: string;
  message?: string;
  raw?: string;
  logType?: string;
  sourceFile?: string;
  // CDN fields
  host?: string;
  url?: string;
  status?: number;
  method?: string;
  cache?: string;
  requestId?: string;
  aemEnvKind?: string;
  aemTenant?: string;
  rules?: string;
  // Request fields
  responseTime?: number;
  path?: string;
  pod?: string;
  clientIp?: string;
  referrer?: string;
  userAgent?: string;
  [key: string]: unknown;
}

export interface EventsResponse {
  success?: boolean;
  events: LogEvent[];
  total: number;
  levelCounts?: { ALL: number; ERROR: number; WARN: number; INFO: number; DEBUG: number };
  logType: string;
  packages?: string[];
  loggers?: string[];
  threads?: string[];
  exceptions?: string[];
  methods?: string[];
  statuses?: string[];
  pods?: string[];
  cacheStatuses?: string[];
  countries?: string[];
  pops?: string[];
  hosts?: string[];
  urls?: string[];
  error?: string;
}
