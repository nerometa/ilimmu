import { redirect } from '@sveltejs/kit';
import { ownerProfile } from '#lib/server/records/service.ts';
import { personalData } from '#lib/server/exports/service.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.ownerId) redirect(303, '/login');
  return { state: await personalData((await ownerProfile(locals.ownerId)).id) };
};
