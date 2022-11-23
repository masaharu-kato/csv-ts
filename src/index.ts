import fs from 'fs';
import csv_parse from 'csv-parse';
import { Readable } from 'stream';

type Input = fs.PathLike | Readable;

async function* iter_csv(
  input: Input,
  options?: csv_parse.Options
): AsyncGenerator<string[]> {
  const stream = input instanceof Readable ? input : fs.createReadStream(input);
  const parser = stream.pipe(csv_parse.parse(options));
  for await (const row of parser) {
    yield row as string[];
  }
}

async function read_csv_header(
  itr: AsyncGenerator<string[]>
): Promise<string[]> {
  const head_itr = await itr.next();
  if (!head_itr.value) throw new Error('Empty input');
  return head_itr.value as string[];
}

function map_get<T>(keymap: { [k in keyof T]: string }, key: keyof T): string {
  const value = keymap[key];
  if (value === undefined) throw new Error(`key ${String(key)} not found.`);
  return value;
}

async function read_key_indexes<T>(
  itr: AsyncGenerator<string[]>,
  keymap: { [k in keyof T]: string }
) {
  const header = await read_csv_header(itr);
  const head_idxes = Object.fromEntries(header.map((v, i) => [v, i]));
  const keys = Object.keys(keymap) as (keyof T)[];
  return (keys as (keyof T)[]).map(
    (k) => [k, head_idxes[map_get(keymap, k)]] as const
  );
}

async function* _read_csv_with_header<T>(
  input: Input,
  keymap: { [k in keyof T]: string },
  options?: csv_parse.Options
): AsyncGenerator<T> {
  const itr = iter_csv(input, options);
  const key_idxes = await read_key_indexes(itr, keymap);
  for await (const row of itr) {
    yield Object.fromEntries(key_idxes.map(([name, i]) => [name, row[i]])) as T;
  }
}

async function* _read_csv_without_header<T>(
  input: Input,
  keys: (keyof T)[],
  options?: csv_parse.Options
): AsyncGenerator<T> {
  for await (const row of iter_csv(input, options)) {
    yield Object.fromEntries(keys.map((key, i) => [key, row[i]])) as T;
  }
}

function to_keys<T extends object>(
  keys: { [k in keyof T]: string } | (keyof T)[]
): (keyof T)[] {
  if (keys instanceof Array) return keys;
  if (keys instanceof Object) return Object.keys(keys) as (keyof T)[];
  throw new Error('Invalid type of keys.');
  // return type_keys<T>();
}

function to_keymap<T extends object>(
  keymap?: { [k in keyof T]: string } | (keyof T)[]
): { [k in keyof T]: string } {
  if (keymap instanceof Array) {
    return Object.fromEntries(keymap.map((k) => [k, k as string])) as {
      [k in keyof T]: string;
    };
  }
  if (keymap instanceof Object) return keymap;
  throw new Error('Invalid type of keys.');
  // return Object.fromEntries(type_keys<T>().map((k) => [k, k as string])) as {
  //   [k in keyof T]: string;
  // };
}

export interface Options extends csv_parse.Options {
  has_header?: boolean;
}

export async function* read_csv<T extends object>(
  input: Input,
  keys: { [k in keyof T]: string } | (keyof T)[],
  options?: Options
): AsyncGenerator<T> {
  if (options?.has_header === false) {
    yield* _read_csv_without_header(input, to_keys<T>(keys), options);
  } else {
    yield* _read_csv_with_header(input, to_keymap<T>(keys), options);
  }
}

export async function* read_tsv<T extends object>(
  input: Input,
  keys: { [k in keyof T]: string } | (keyof T)[],
  options?: Options
) {
  yield* read_csv(input, keys, { delimiter: '\t', ...options });
}
