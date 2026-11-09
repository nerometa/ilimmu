import { expect, it } from 'vitest';
import { catalog, buildInput } from '../../src/lib/game/builds';
import { characterRecordFor, characterBuildFor } from '../../src/lib/game/roster';
it('shows seven elemental Travelers and retains legacy data only for Anemo',()=>{
  const travelers=catalog.characters.filter(c=>/Traveler|Aether|Lumine/.test(c.name));
  expect(travelers.map(c=>c.name).sort()).toEqual(['Anemo','Cryo','Dendro','Electro','Geo','Hydro','Pyro'].map(e=>`Traveler (${e})`).sort());
  expect(new Set(travelers.map(c=>c.id)).size).toBe(7);
  for(const traveler of travelers.filter(c=>c.element!=='Anemo')) {
    expect(characterRecordFor([{gameId:10000005,owned:true}],traveler.id)).toBeUndefined();
    expect(characterBuildFor([{gameId:10000007}],traveler.id)).toBeUndefined();
  }
  const legacy={gameId:10000007,owned:true,id:'lumine'};
  expect(characterRecordFor([legacy],10000005)).toBe(legacy);
  expect(characterBuildFor([{gameId:10000007,revision:3}],10000005)?.revision).toBe(3);
  expect(characterRecordFor([{gameId:10000005,owned:false},legacy],10000005)).toBe(legacy);
});
it('includes newer Wiki artifact sets and accepts prior saved two-piece wording',()=>{
  expect(catalog.artifacts.length).toBeGreaterThanOrEqual(63);
  expect(catalog.artifacts.some(a=>a.name==="Silken Moon's Serenade")).toBe(true);
  const result=buildInput.safeParse({weaponId:null,weaponLevel:1,weaponAscension:0,refinement:1,artifacts:{mode:'2pc+2pc',effect1:'Increases Elemental Skill DMG by 20%.',effect2:'HP +20%'},sands:null,goblet:null,circlet:null});
  expect(result.success).toBe(true);
});
