export const elements = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'];
export const weaponTypes = ['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst'];

type Filterable = { name: string; rarity: number; element?: string; weaponType?: string; stat?: string };
type Filters = { search?: string; elements?: readonly string[]; weaponTypes?: readonly string[]; rarities?: readonly number[] };

export function matchesGameFilters(item: Filterable, filters: Filters): boolean {
  const queryRarities: number[] = [];
  const name = (filters.search ?? '').replace(/\b([1-5])\s*(?:★|\*|-?stars?\b)/gi, (_, rarity: string) => {
    queryRarities.push(Number(rarity));
    return '';
  }).trim().toLowerCase().replace(/\s+/g, ' ');
  return `${item.name} ${item.stat ?? ''}`.toLowerCase().includes(name)
    && (!queryRarities.length || queryRarities.includes(item.rarity))
    && (!filters.rarities?.length || filters.rarities.includes(item.rarity))
    && (!filters.elements?.length || filters.elements.includes(item.element ?? ''))
    && (!filters.weaponTypes?.length || filters.weaponTypes.includes(item.weaponType ?? ''));
}
