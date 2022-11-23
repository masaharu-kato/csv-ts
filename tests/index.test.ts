import { read_tsv } from '../src';
import fs from 'fs';

interface Person {
  id: number;
  name: string;
  age: number;
}

describe('Test read_tsv()', () => {
  it('Test read_tsv() with keys', async () => {
    const log = jest.spyOn(console, 'log').mockReturnValue();

    const path = 'tests/res/persons.tsv';
    const path_answer = 'tests/res/persons.out';

    let result = '';
    for await (const row of read_tsv<Person>(path, {
      id: 'id',
      name: 'name',
      age: 'age',
    })) {
      result += `${row.name}, ${row.age} years old, id is ${row.id}.\n`;
    }

    const answer = fs.readFileSync(path_answer).toString();
    expect(result).toBe(answer);

    log.mockRestore();
  });
});
