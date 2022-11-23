import fs from 'fs';
import csv_stringify from 'csv-stringify';
import { Writable } from 'stream';

type Output = fs.PathLike | Writable;
type Row = object | string[];
export type WriteOptions = csv_stringify.Options;

export async function write_csv_async<T extends Row>(
  output: Output,
  input: AsyncGenerator<T>,
  options?: WriteOptions
) {
  const stream_given = output instanceof Writable;
  const stream = stream_given ? output : fs.createWriteStream(output);
  const stringifier = csv_stringify.stringify(options ?? {});
  stringifier.pipe(stream);
  for await (const row of input) stringifier.write(row);
  stringifier.end();
  if (!stream_given) stream.end();
}

export function write_csv<T extends Row>(
  output: Output,
  input: Generator<T> | T[],
  options?: WriteOptions
) {
  const stream_given = output instanceof Writable;
  const stream = stream_given ? output : fs.createWriteStream(output);
  const stringifier = csv_stringify.stringify(options ?? {});
  stringifier.pipe(stream);
  for (const row of input) stringifier.write(row);
  stringifier.end();
  if (!stream_given) stream.end();
}

export async function write_tsv_async<T extends Row>(
  output: Output,
  input: AsyncGenerator<T>,
  options?: WriteOptions
) {
  return write_csv_async(output, input, { delimiter: '\t', ...options });
}

export async function write_tsv<T extends Row>(
  output: Output,
  input: Generator<T> | T[],
  options?: WriteOptions
) {
  return write_csv(output, input, { delimiter: '\t', ...options });
}
