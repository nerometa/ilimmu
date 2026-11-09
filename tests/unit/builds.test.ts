import { expect, it } from 'vitest';
import { buildInput } from '../../src/lib/game/builds';
const build = { weaponId: 11426, weaponLevel: 80, weaponAscension: 6, refinement: 5,
  artifacts: { mode: '4pc', setId: 15032 }, sands: 'HP%', goblet: 'Hydro DMG Bonus', circlet: 'CRIT Rate' };
it('rejects stats in the wrong slot and accepts valid main stats', () => {
  expect(buildInput.safeParse(build).success).toBe(true);
  expect(buildInput.safeParse({...build, sands:'CRIT Rate'}).success).toBe(false);
  expect(buildInput.safeParse({...build, goblet:'Healing Bonus'}).success).toBe(false);
});
it('validates paired effects against real sets and catalog weapons', () => {
  expect(buildInput.safeParse({...build,artifacts:{mode:'2pc+2pc',effect1:'Increases Elemental Skill DMG by 20%.',effect2:'HP +20%'}}).success).toBe(true);
  expect(buildInput.safeParse({...build,artifacts:{mode:'2pc+2pc',effect1:'HP +20%',effect2:'HP +20%'}}).success).toBe(true);
  expect(buildInput.safeParse({...build,weaponId:999999}).success).toBe(false);
});

it('groups equivalent Wiki bonus wording and permits two distinct Anemo sets',async()=>{
  const {effects,canonicalEffect,setsForEffect}=await import('../../src/lib/game/builds');
  expect(effects.filter(e=>/^ATK/.test(e))).toEqual(['ATK +18%']);
  expect(canonicalEffect('ATK increased by 18%.')).toBe('ATK +18%');
  expect(canonicalEffect('Anemo DMG Bonus +15%.')).toBe('Anemo DMG Bonus +15%');
  expect(setsForEffect('Anemo DMG Bonus +15%').length).toBeGreaterThanOrEqual(2);
  expect(buildInput.safeParse({...build,artifacts:{mode:'2pc+2pc',effect1:'Anemo DMG Bonus +15%',effect2:'Anemo DMG Bonus +15%.'}}).success).toBe(true);
});
