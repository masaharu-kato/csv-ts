import { write_tsv } from '../src';
import fs from 'fs';
import path from 'path';

describe('Test write_tsv()', () => {
  it('Test write_tsv() with generator', async () => {
    const log = jest.spyOn(console, 'log').mockReturnValue();

    const path_result = 'tests/out/persons.tsv';
    const path_answer = 'tests/res/persons.tsv';

    const data = [
      { id: 1, name: 'John Tanaka', age: 25 },
      { id: 2, name: 'Taro Suzuki', age: 31 },
      { id: 3, name: 'Tom Sato', age: 17 },
      { id: 4, name: 'Judy Foobar', age: 25 },
      { id: 5, name: 'Unnamed', age: 27 },
      { id: 6, name: 'Sachi Piyo', age: 20 },
    ];

    fs.mkdirSync(path.dirname(path_result), { recursive: true });

    write_tsv(
      path_result,
      (function* () {
        for (const row of data) yield row;
      })(),
      { header: true }
    );

    const result = fs.readFileSync(path_result).toString();
    const answer = fs.readFileSync(path_answer).toString();
    expect(result).toEqual(answer);

    log.mockRestore();
  });
});
