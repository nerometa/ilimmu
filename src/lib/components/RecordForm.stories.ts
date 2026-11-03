import type { Meta, StoryObj } from '@storybook/sveltekit';
import { expect } from 'storybook/test';
import RecordForm from './RecordForm.svelte';
import { sampleState } from '../../../.storybook/fixtures.ts';
import { mockApi } from '../../../.storybook/api-fixture.ts';

const meta = {
  title: 'Forms/Actual records',
  component: RecordForm,
  args: { kind: 'inventory', record: sampleState.inventory[0] },
  beforeEach: () => mockApi()
} satisfies Meta<typeof RecordForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Inventory: Story = {};
export const Character: Story = { args: { kind: 'characters', record: sampleState.characters[0] } };
export const WeaponInstance: Story = { args: { kind: 'weapons', record: sampleState.weapons[0] } };
export const AddInventory: Story = { args: { record: undefined } };
export const ConsecutiveWeapons: Story = {
  args: { kind: 'weapons', record: undefined },
  play: async ({ canvas, userEvent }) => {
    for (const name of ['First copy', 'Second copy']) {
      await userEvent.type(canvas.getByLabelText('Name'), name);
      await userEvent.type(canvas.getByLabelText('Game ID'), '11401');
      await userEvent.click(canvas.getByRole('button', { name: 'Add actual record' }));
      await expect(canvas.getByRole('status')).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Add actual record' })).toBeEnabled();
      await expect(canvas.getByLabelText('Actual level')).toHaveValue(1);
      await expect(canvas.getByLabelText('Actual ascension')).toHaveValue(0);
      await expect(canvas.getByLabelText('Refinement rank')).toHaveValue(1);
    }
    await expect(window.fetch).toHaveBeenCalledTimes(2);
  }
};
export const SavedQuantity: Story = {
  play: async ({ canvas, userEvent }) => {
    // Given an existing absolute quantity, when a new total is saved.
    const quantity = canvas.getByLabelText('Actual quantity (absolute total)');
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '125000');
    await userEvent.click(canvas.getByRole('button', { name: 'Save actual record' }));
    // Then the API receives the total and the saved revision, not a delta.
    await expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/inventory/'),
      expect.objectContaining({ method: 'PUT', body: expect.stringContaining('"quantity":125000') })
    );
    await expect(canvas.getByRole('status')).toBeVisible();
  }
};
export const NegativeQuantity: Story = {
  play: async ({ canvas, userEvent }) => {
    // Given a numeric field, when a negative total is entered.
    const quantity = canvas.getByLabelText('Actual quantity (absolute total)');
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '-1');
    await userEvent.click(canvas.getByRole('button', { name: 'Save actual record' }));
    // Then native validation rejects the input before any write.
    await expect(quantity).toBeInvalid();
    await expect(window.fetch).not.toHaveBeenCalled();
  }
};
export const FailedSavePreservesDraft: Story = {
  beforeEach: () => mockApi('failed'),
  play: async ({ canvas, userEvent }) => {
    const quantity = canvas.getByLabelText('Actual quantity (absolute total)');
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '125000');
    await userEvent.click(canvas.getByRole('button', { name: 'Save actual record' }));
    await expect(canvas.getByRole('alert')).toBeVisible();
    await expect(quantity).toHaveValue(125000);
    await expect(canvas.getByRole('button', { name: 'Save actual record' })).toBeEnabled();
  }
};
export const DuplicateCanBeCorrected: Story = {
  beforeEach: () => mockApi('duplicate'),
  args: { record: undefined },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Name'), 'Mora');
    await userEvent.type(canvas.getByLabelText('Game ID'), '202');
    await userEvent.click(canvas.getByRole('button', { name: 'Add actual record' }));
    await expect(canvas.getByRole('alert')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Add actual record' })).toBeEnabled();
    await expect(canvas.getByLabelText('Game ID')).toHaveValue(202);
  }
};
export const StaleReviewPreservesDraft: Story = {
  beforeEach: () => mockApi('stale'),
  play: async ({ canvas, userEvent }) => {
    const quantity = canvas.getByLabelText('Actual quantity (absolute total)');
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '125000');
    await userEvent.click(canvas.getByRole('button', { name: 'Save actual record' }));
    await expect(canvas.getByRole('button', { name: 'Save actual record' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Reload saved records for review' }));
    await expect(canvas.getByRole('region', { name: 'Latest saved record' })).toBeVisible();
    await expect(quantity).toHaveValue(125000);
    await userEvent.click(canvas.getByRole('checkbox'));
    await userEvent.click(canvas.getByRole('button', { name: 'Save actual record' }));
    await expect(window.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/inventory/'),
      expect.objectContaining({ method: 'PUT', body: expect.stringContaining('"revision":4') })
    );
  }
};
