export type PathResolver = (...paths: string[]) => string;
export type RelativePathResolver = (path: string, startsWithDot?: boolean) => string;
