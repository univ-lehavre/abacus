import { eldiv } from '../src';

describe('eldiv', () => {
  it('divise élément par élément deux tableaux', () => {
    expect(eldiv([10, 20, 30], [2, 4, 5])).toEqual([5, 5, 6]);
  });

  it('retourne 0 si le dénominateur est 0', () => {
    expect(eldiv([1, 2, 3], [1, 0, 3])).toEqual([1, 0, 1]);
  });

  it('gère les tableaux vides', () => {
    expect(eldiv([], [])).toEqual([]);
  });
});
