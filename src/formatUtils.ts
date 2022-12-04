import { formatWithOptions } from 'node:util';
import kleur from 'kleur';

import { Entry } from './entry';

let { FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM } = process.env;
let isTTY = process.stdout.isTTY;

export const colorEnabled = !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== 'dumb' && (
  FORCE_COLOR != null && FORCE_COLOR !== '0' || isTTY
);

export function format(msg: string, ...args: any[]): string {
  return formatWithOptions({ colors: colorEnabled }, msg, ...args);
}

export function module(module: Entry['module']): string {
  return {
    esmodule: 'ESM',
    commonjs: 'CommonJS',
    file: 'File',
    dts: 'TypeScript declaration',
  }[module];
}

export function platform(platform: 'web' | 'node'): string {
  return {
    web: 'Web',
    node: 'Node.js',
  }[platform];
}

export function hyperlink(hyperlink: string): string {
  return kleur.underline().cyan(hyperlink);
}

export function path(path: string): string {
  return kleur.underline().yellow(path);
}

export function literal(literal: unknown): string {
  if (literal === null || literal === undefined) {
    return kleur.bold().green(`${literal}`);
  }
  if (typeof literal === 'string') {
    return kleur.green(`'${literal}'`);
  }
  if (typeof literal !== 'object') {
    return kleur.green(`${literal}`);
  }
  return object(literal);
}

export function key(text: string): string {
  return kleur.bold().blue(`"${text}"`);
}

export function object(object: object): string {
  const formatted = formatWithOptions({ colors: colorEnabled }, '%o', object);
  return kleur.white(formatted);
}

export function command(command: string): string {
  return kleur.bold().blue(`\`${command}\``);
}

export function highlight(text: string): string {
  return kleur.bold().cyan(text);
}
