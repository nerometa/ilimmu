import { error } from '@sveltejs/kit';
import { canonicalCharacterId } from '#lib/game/roster.ts';
import { catalog } from '#lib/game/builds.ts';
export function load({ params }: { params: { gameId:string } }) {
  const character=catalog.characters.find(c=>c.id===canonicalCharacterId(Number(params.gameId)));
  if(!character) error(404,'Character not found.');
  return { character };
}
