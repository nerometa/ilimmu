import type { Meta, StoryObj } from '@storybook/sveltekit';
import { expect, fn } from 'storybook/test';
import ConflictCard from './ConflictCard.svelte';
import { sampleState } from '../../../.storybook/fixtures.ts';

const inventory = sampleState.inventory[0];
const observation = sampleState.observations[0];
const conflict = sampleState.conflicts[0];
if (!inventory || !observation || !conflict) throw new Error('Conflict story fixtures are incomplete.');
const meta = {
  title: 'Data/Conflict decision',
  component: ConflictCard,
  args: { inventory, observation, conflict, onresolve: fn() }
} satisfies Meta<typeof ConflictCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const PendingDecision: Story = {};
export const Saving: Story = { args: { pending: true } };
export const StaleRequiresReview: Story = { args: { disabled: true } };
export const Resolved: Story = { args: { conflict: { ...conflict, resolution: 'keep-manual', revision: 1, resolvedAt: '2026-10-22T12:10:00.000Z' } } };
export const KeepManual: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Keep manual value' }));
    await expect(args.onresolve).toHaveBeenCalledTimes(1);
    await expect(args.onresolve).toHaveBeenCalledWith('keep-manual');
  }
};
export const AcceptObservation: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Accept observation' }));
    await expect(args.onresolve).toHaveBeenCalledTimes(1);
    await expect(args.onresolve).toHaveBeenCalledWith('accept-source');
  }
};
