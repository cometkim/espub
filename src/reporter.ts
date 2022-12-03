import { formatWithOptions } from 'node:util';
import kleur from 'kleur';

import { colorEnabled } from './formatUtils';

export interface Reporter {
  debug(msg: string, ...args: any[]): void;
  info(msg: string, ...args: any[]): void;
  warn(msg: string, ...args: any[]): void;
  error(msg: string, ...args: any[]): void;
  captureException(exn: unknown): void;
}

export class ConsoleReporter implements Reporter {
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

  captureException(exn: unknown): void {
    let formatted;
    if (exn instanceof Error) {
      formatted = formatWithOptions(
        { colors: this.color },
        exn.stack,
      );
    } else {
      formatted = formatWithOptions(
        { colors: this.color },
        '%s',
        exn,
      );
    }
    const indented = this.#indent(formatted);
    this.#console.error(
      kleur.bold().red(`${indented}`),
    );
  }

  createChildReporter(): ConsoleReporter {
    const child = new ConsoleReporter(this.#console, this.#level + 1);
    child.color = this.color;
    return child;
  }
};
