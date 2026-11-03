import { describe, expect, it } from 'vitest';
import { inventoryInput, profileInput, characterInput, goalInput } from '../../src/lib/contracts';

describe('boundary contracts', () => {
  it.each([-1, 0.5, 2147483648])('rejects invalid absolute inventory quantity %s', (quantity) => {
    // Given a material edit with a quantity that cannot be stored safely.
    const input = { gameId: 202, name: 'Mora', quantity };
    // When it crosses the API boundary.
    const result = inventoryInput.safeParse(input);
    // Then it cannot reach a database write.
    expect(result.success).toBe(false);
  });

  it('accepts an empty UID but requires an explicit supported server', () => {
    const input = { uid: '', name: 'Traveler', server: 'Asia', revision: 0 };
    const result = profileInput.safeParse(input);
    expect(result.success).toBe(true);
    expect(profileInput.safeParse({ ...input, server: 'unknown' }).success).toBe(false);
  });

  it('rejects unsupported progression without coercing it', () => {
    const input = {
      gameId: 10000021, name: 'Amber', level: 91, ascension: 0,
      talentAttack: 1, talentSkill: 1, talentBurst: 1
    };
    expect(characterInput.safeParse(input).success).toBe(false);
  });

  it('requires exactly one goal subject', () => {
    const input = {
      name: 'A target', priority: 'Maintain', targetLevel: 80,
      targetAscension: 5, buildNotes: '', completed: false
    };
    expect(goalInput.safeParse(input).success).toBe(false);
  });
});
