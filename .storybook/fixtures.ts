import type { ExportData } from '../src/lib/contracts.ts';

export const sampleState: ExportData = {
  format: 'genshin-companion',
  version: 1,
  generatedAt: '2026-10-22T12:00:00.000Z',
  profile: {
    id: '10000000-0000-4000-8000-000000000001', name: 'Traveler',
    uid: '700000001', server: 'Europe', revision: 0,
    updatedAt: '2026-10-22T12:00:00.000Z', lastExportGeneratedAt: null
  },
  characters: [{
    id: '10000000-0000-4000-8000-000000000002',
    profileId: '10000000-0000-4000-8000-000000000001', gameId: 10000042,
    owned:true, name: 'Keqing', level: 70, ascension: 4, talentAttack: 6, talentSkill: 6,
    talentBurst: 6, revision: 2, manualOverride: true, source: 'manual',
    updatedAt: '2026-10-22T12:00:00.000Z'
  }, {
    id: '10000000-0000-4000-8000-000000000003',
    profileId: '10000000-0000-4000-8000-000000000001', gameId: 10000031,
    owned:true, name: 'Fischl', level: 60, ascension: 3, talentAttack: 2, talentSkill: 6,
    talentBurst: 4, revision: 0, manualOverride: false, source: 'manual',
    updatedAt: '2026-10-22T12:00:00.000Z'
  }],
  builds: [],
  weapons: [{
    id: '10000000-0000-4000-8000-000000000004',
    profileId: '10000000-0000-4000-8000-000000000001', gameId: 11401,
    name: 'Favonius Sword', level: 70, ascension: 4, refinement: 2, revision: 1,
    manualOverride: true, source: 'manual', updatedAt: '2026-10-22T12:00:00.000Z'
  }],
  inventory: [{
    id: '10000000-0000-4000-8000-000000000005',
    profileId: '10000000-0000-4000-8000-000000000001', gameId: 202,
    name: 'Mora', quantity: 120000, revision: 3, manualOverride: true,
    source: 'manual', updatedAt: '2026-10-22T12:00:00.000Z'
  }],
  goals: [{
    id: '10000000-0000-4000-8000-000000000006',
    profileId: '10000000-0000-4000-8000-000000000001',
    characterId: '10000000-0000-4000-8000-000000000002', weaponId: null,
    name: 'Aggravate build', priority: 'Actively Building',
    targetLevel: 90, targetAscension: 6, targetAttack: 8, targetSkill: 8,
    targetBurst: 8, buildNotes: 'Finish ascension, then work on talents.',
    completedAt: null, revision: 1, updatedAt: '2026-10-22T12:00:00.000Z'
  }],
  observations: [{
    id: '10000000-0000-4000-8000-000000000007',
    profileId: '10000000-0000-4000-8000-000000000001',
    inventoryId: '10000000-0000-4000-8000-000000000005',
    quantity: 95000, source: 'fixture-observation', observedAt: '2026-10-22T12:05:00.000Z'
  }],
  conflicts: [{
    id: '10000000-0000-4000-8000-000000000008',
    profileId: '10000000-0000-4000-8000-000000000001',
    inventoryId: '10000000-0000-4000-8000-000000000005',
    observationId: '10000000-0000-4000-8000-000000000007',
    resolution: null, revision: 0, resolvedAt: null, createdAt: '2026-10-22T12:05:00.000Z'
  }]
};
