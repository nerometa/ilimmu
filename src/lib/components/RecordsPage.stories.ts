import type { Meta, StoryObj } from '@storybook/sveltekit';
import { expect } from 'storybook/test';
import RecordsPage from './RecordsPage.svelte';
import { sampleState } from '../../../.storybook/fixtures.ts';

const meta = {
  title: 'Screens/Actual records',
  component: RecordsPage,
  args: { state: sampleState, kind: 'characters' }
} satisfies Meta<typeof RecordsPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Characters: Story = {};
export const Weapons: Story = { args: { kind: 'weapons' } };
export const Inventory: Story = { args: { kind: 'inventory' } };
export const Empty: Story = { args: { state: { ...sampleState, characters: [], goals: [] } } };
export const CharacterEditor: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit Keqing' }));
    const level = canvas.getByLabelText('Actual level');
    await userEvent.clear(level);
    await userEvent.type(level, '80');
    await expect(level).toHaveValue(80);
    await expect(canvas.getByRole('button', { name: 'Save actual record' })).toBeEnabled();
  }
};
