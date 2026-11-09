import { canonicalCharacterId } from '../../game/roster';
import { and, eq, sql, inArray, ne } from 'drizzle-orm';
import { db } from '../db';
import { characters, characterBuilds } from '../db/schema';
import { catalog, type Build } from '../../game/builds';
import { changed, WriteError } from '../provenance/safe-write';

export async function setOwnership(profileId: string, gameId: number, owned: boolean, revision: number | null) {
  const entry = catalog.characters.find(c => c.id === canonicalCharacterId(gameId));
  if (!entry) throw new WriteError(422, 'INVALID_SUBJECT', 'Choose a character from the roster.');
  return db.transaction(async tx=>{
    const row=revision===null
      ? (await tx.insert(characters).values({profileId,gameId,name:entry.name,owned,level:1,ascension:0,talentAttack:1,talentSkill:1,talentBurst:1}).onConflictDoNothing().returning())[0]
      : (await tx.update(characters).set({owned,name:entry.name,revision:sql`${characters.revision} + 1`,updatedAt:new Date()})
        .where(and(eq(characters.profileId,profileId),eq(characters.gameId,gameId),eq(characters.revision,revision))).returning())[0];
    const saved=changed(row);
    if(canonicalCharacterId(gameId)===10000005){
      await tx.update(characters).set({owned,name:entry.name,revision:sql`${characters.revision} + 1`,updatedAt:new Date()})
        .where(and(eq(characters.profileId,profileId),inArray(characters.gameId,[10000005,10000007]),ne(characters.id,saved.id)));
    }
    return saved;
  });
}

export async function saveBuild(profileId: string, gameId: number, data: Build, revision: number | null) {
  const character = catalog.characters.find(c=>c.id===canonicalCharacterId(gameId));
  const weapon = catalog.weapons.find(w=>w.id===data.weaponId);
  if (!character || (weapon && weapon.weaponType !== character.weaponType)) {
    throw new WriteError(422,'INVALID_SUBJECT','Choose a weapon matching this character’s weapon type.');
  }
  const row = revision === null
    ? (await db.insert(characterBuilds).values({profileId,gameId,data}).onConflictDoNothing().returning())[0]
    : (await db.update(characterBuilds).set({data,revision:sql`${characterBuilds.revision} + 1`,updatedAt:new Date()})
      .where(and(eq(characterBuilds.profileId,profileId),eq(characterBuilds.gameId,gameId),eq(characterBuilds.revision,revision))).returning())[0];
  const saved = changed(row);
  return {...saved.data, gameId:saved.gameId,profileId:saved.profileId,revision:saved.revision,updatedAt:saved.updatedAt};
}
