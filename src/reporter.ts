import { formatWithOptions } from 'node:util';
import kleur from 'kleur';

import { colorEnabled } from './formatUtils';

export class Reporter {
  #level: number;
  #console: Console;

  color = colorEnabled;
  level: 'default' | 'debug' = 'debug';

  constructor(console: Console, level = 0) {
    this.#level = level;
    this.#console = console;
  }

  #indent(msg: string): string {
    const tabStr = '  ';
    const padding = tabStr.repeat(this.#level);
    return msg
      .split('\n')
      .map(msg => `${padding}${msg}`)
      .join('\n');
  }

  debug(msg: string, ...args: any[]): void {
    if (this.level !== 'debug') {
      return;
    }

    const formatted = formatWithOptions(
      { colors: this.color },
      msg,
      ...args,
    );
    const indented = this.#indent(formatted);
    this.#console.debug(`[debug] ${indented}`);
  }

  info(msg: string, ...args: any[]): void {
    const formatted = formatWithOptions(
      { colors: this.color },
      msg,
      ...args,
    );
    const indented = this.#indent(formatted);
    this.#console.info(`[info] ${indented}`);
  }

  warn(msg: string, ...args: any[]): void {
    const formatted = formatWithOptions(
      { colors: this.color },
      msg,
      ...args,
    );
    const indented = this.#indent(formatted);
    this.#console.warn(
      kleur.yellow(`[warn] ${indented}`),
    );
  }

  error(msg: string, ...args: any[]): void {
    const formatted = formatWithOptions(
      { colors: this.color },
      msg,
      ...args,
    );
    const indented = this.#indent(formatted);
    this.#console.error(
      kleur.red(`[error] ${indented}`),
    );
  }

  captureError(error: unknown): void {
    let formatted;
    if (error instanceof Error) {
      formatted = formatWithOptions(
        { colors: this.color },
        error.stack,
      );
    } else {
      formatted = formatWithOptions(
        { colors: this.color },
        '%s',
        error,
      );
    }
    const indented = this.#indent(formatted);
    this.#console.error(
      kleur.bold().red(`[error] ${indented}`),
    );
  }

  createChildReporter(): Reporter {
    const child = new Reporter(this.#console, this.#level + 1);
    child.color = this.color;
    return child;
  }
};
