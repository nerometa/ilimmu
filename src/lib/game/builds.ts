import { z } from 'zod';
import catalog from './catalog.json';
import legacyEffects from './legacy-effects.json';
export { catalog };
export const mainStats = {
  sands: ['HP%', 'ATK%', 'DEF%', 'Elemental Mastery', 'Energy Recharge'],
  goblet: ['HP%', 'ATK%', 'DEF%', 'Elemental Mastery', 'Physical DMG Bonus', 'Pyro DMG Bonus', 'Hydro DMG Bonus', 'Electro DMG Bonus', 'Cryo DMG Bonus', 'Anemo DMG Bonus', 'Geo DMG Bonus', 'Dendro DMG Bonus'],
  circlet: ['HP%', 'ATK%', 'DEF%', 'Elemental Mastery', 'CRIT Rate', 'CRIT DMG', 'Healing Bonus']
} as const;
/** Stable semantic grouping; source text remains unchanged in the Wiki snapshot. */
export function canonicalEffect(value:string):string {
  const id=Object.entries(legacyEffects).find(([text])=>text===value)?.[1];
  let text=((id?catalog.artifacts.find(a=>a.id===id)?.effect2:undefined)??value).trim().replace(/\.$/,'').replace(/\s+/g,' ').replace(/\+\s+/g,'+');
  text=text.replace(/^(ATK|HP|DEF) increased by (\d+)%$/,'$1 +$2%');
  text=text.replace(/^Increases Elemental Mastery by (\d+)$/,'Elemental Mastery +$1');
  text=text.replace(/^Character Healing Effectiveness /,'Healing Bonus ');
  return text;
}
export function effectKey(value:string):string { return canonicalEffect(value).toLowerCase(); }
export function setsForEffect(value:string){return catalog.artifacts.filter(a=>effectKey(a.effect2)===effectKey(value));}
export const effects=[...new Set(catalog.artifacts.map(a=>canonicalEffect(a.effect2)).filter(Boolean))].sort();
const effect=z.string().transform(canonicalEffect).refine(value=>effects.includes(value),'Choose an artifact effect.');
const artifacts = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('4pc'), setId: z.number().int().refine(id => catalog.artifacts.some(a => a.id === id && a.effect4), 'Choose a four-piece set.').nullable() }),
  z.strictObject({ mode: z.literal('2pc+2pc'), effect1: effect.nullable(), effect2: effect.nullable() })
]).refine(v => v.mode !== '2pc+2pc' || v.effect1 === null || v.effect2 === null || v.effect1 !== v.effect2 || setsForEffect(v.effect1).length >= 2, 'This effect needs two distinct artifact sets.');
export const buildInput = z.strictObject({
  weaponId: z.number().int().refine(id => catalog.weapons.some(w => w.id === id), 'Choose a catalog weapon.').nullable(),
  weaponLevel: z.number().int().min(1).max(90),
  weaponAscension: z.number().int().min(0).max(6),
  refinement: z.number().int().min(1).max(5),
  artifacts,
  sands: z.enum(mainStats.sands).nullable(), goblet: z.enum(mainStats.goblet).nullable(), circlet: z.enum(mainStats.circlet).nullable()
});
export type Build = z.infer<typeof buildInput>;
export const emptyBuild: Build = { weaponId:null, weaponLevel:1, weaponAscension:0, refinement:1, artifacts:{mode:'4pc',setId:null}, sands:null, goblet:null, circlet:null };
export const buildEdit = buildInput.extend({ revision:z.number().int().nonnegative().nullable() });
export const buildRecord = buildInput.extend({ gameId:z.number().int(), profileId:z.uuid(), revision:z.number().int().nonnegative(), updatedAt:z.iso.datetime() });
export function maxLevel(ascension: number) { return [20,40,50,60,70,80,90][ascension] ?? 90; }

export function buildValues(value: Build = emptyBuild): Build {
  const {weaponId,weaponLevel,weaponAscension,refinement,artifacts,sands,goblet,circlet}=value;
  return {weaponId,weaponLevel,weaponAscension,refinement,artifacts,sands,goblet,circlet};
}
