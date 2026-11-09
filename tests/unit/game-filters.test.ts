import { expect, it } from 'vitest';
import { matchesGameFilters } from '../../src/lib/game/filters';

const furina = { name: 'Furina', rarity: 5, element: 'Hydro', weaponType: 'Sword' };
const amber = { name: 'Amber', rarity: 4, element: 'Pyro', weaponType: 'Bow' };

it('combines groups while allowing multiple choices within each group', () => {
  const filters = { elements: ['Hydro', 'Pyro'], weaponTypes: ['Sword'], rarities: [5, 4] };
  expect(matchesGameFilters(furina, filters)).toBe(true);
  expect(matchesGameFilters(amber, filters)).toBe(false);
  expect(matchesGameFilters(furina, { rarities: [4] })).toBe(false);
  expect(matchesGameFilters(amber, {})).toBe(true);
});

it('recognizes rarity in character and weapon searches', () => {
  for (const search of ['Furina 5 ★', 'furina 5-star', '5* Furina']) {
    expect(matchesGameFilters(furina, { search })).toBe(true);
    expect(matchesGameFilters(amber, { search })).toBe(false);
  }
  const weapon = { name: 'The Catch', stat: 'Energy Recharge', rarity: 4, weaponType: 'Polearm' };
  expect(matchesGameFilters(weapon, { search: '4 ★ recharge' })).toBe(true);
  expect(matchesGameFilters(weapon, { search: '5 ★' })).toBe(false);
  expect(matchesGameFilters(furina, { search: '4 ★ 5 ★' })).toBe(true);
  expect(matchesGameFilters(furina, { search: '5 ★', rarities: [4] })).toBe(false);
});
