import { decimosPercentuais, formatarPercentual } from './percentual';

describe('percentual (D09)', () => {
  it('2 de 4 → 50,0%', () => expect(formatarPercentual(2, 4)).toBe('50,0%'));
  it('7 de 12 → 58,3%', () => expect(formatarPercentual(7, 12)).toBe('58,3%'));
  it('1 de 8 → 12,5% (sem erro de ponto flutuante)', () => expect(formatarPercentual(1, 8)).toBe('12,5%'));
  it('2 de 3 → 66,7% (arredonda meio para cima)', () => expect(formatarPercentual(2, 3)).toBe('66,7%'));
  it('17 de 40 → 42,5%', () => expect(formatarPercentual(17, 40)).toBe('42,5%'));
  it('denominador zero não vira 0%', () => expect(formatarPercentual(0, 0)).toBe('—'));
  it('rejeita entradas inválidas', () => {
    expect(() => decimosPercentuais(-1, 4)).toThrow(RangeError);
    expect(() => decimosPercentuais(1, 0)).toThrow(RangeError);
    expect(() => decimosPercentuais(1.5, 4)).toThrow(RangeError);
  });
});
