export type Reporter = {
  debug: (msg: unknown, ...args: any[]) => void,
  info: (msg: string, ...args: any[]) => void,
  warn: (msg: string, ...args: any[]) => void,
  error: (error: unknown) => void,
};
