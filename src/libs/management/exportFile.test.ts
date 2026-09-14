import { describe, expect, it } from 'vitest';
import { csvCell } from './exportFile';

describe(csvCell, () => {
  it('prefixes a cell that starts with an equals sign', () => {
    expect(csvCell('=1+1')).toBe("'=1+1");
  });

  it('prefixes cells that start with formula characters', () => {
    expect(csvCell('+cmd')).toBe("'+cmd");
    expect(csvCell('-2+3')).toBe("'-2+3");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvCell('\t=1+1')).toBe("'\t=1+1");
    expect(csvCell('\r=1+1')).toBe("'\r=1+1");
  });

  it('leaves ordinary cells unchanged', () => {
    expect(csvCell('hello')).toBe('hello');
    expect(csvCell(42)).toBe('42');
  });
});
