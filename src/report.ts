export type Reporter = {
  debug: (msg: string) => void,
  info: (msg: string) => void,
  warn: (msg: string) => void,
  error: (error: unknown) => void,
};
