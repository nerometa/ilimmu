/** Stable app variant IDs. Legacy Aether/Lumine records belong to Anemo only. */
export function isTravelerId(gameId: number): boolean {
  return gameId === 10000005 || gameId === 10000007 || (gameId >= 90000001 && gameId <= 90000006);
}
export function canonicalCharacterId(gameId:number):number { return gameId===10000007?10000005:gameId; }
export function characterRecordFor<T extends {gameId:number;owned:boolean}>(records:T[],gameId:number):T|undefined {
  const matches=records.filter(r=>canonicalCharacterId(r.gameId)===canonicalCharacterId(gameId));
  return matches.find(r=>r.owned&&r.gameId===gameId)??matches.find(r=>r.owned)??matches.find(r=>r.gameId===gameId)??matches[0];
}
export function characterBuildFor<T extends {gameId:number}>(records:T[],gameId:number):T|undefined {
  return records.find(r=>r.gameId===gameId)??records.find(r=>canonicalCharacterId(r.gameId)===canonicalCharacterId(gameId));
}
