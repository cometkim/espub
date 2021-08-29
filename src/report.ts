export type Reporter = {
  info: (msg: string) => void,
  warn: (msg: string) => void,
  error: (error: unknown) => void,
};
