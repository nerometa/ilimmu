import type { Meta, StoryObj } from '@storybook/sveltekit';
import Provenance from './Provenance.svelte';

const meta = {
  title: 'Data/Provenance',
  component: Provenance,
  args: { source: 'manual', manualOverride: false, revision: 0, updatedAt: '2026-10-22T12:00:00.000Z' }
} satisfies Meta<typeof Provenance>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ManualEntry: Story = {};
export const ManualCorrection: Story = { args: { manualOverride: true, revision: 3 } };
export const AcceptedObservation: Story = { args: { source: 'fixture-observation', revision: 4 } };
