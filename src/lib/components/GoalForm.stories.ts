import type { Meta, StoryObj } from '@storybook/sveltekit';
import { expect } from 'storybook/test';
import GoalForm from './GoalForm.svelte';
import { sampleState } from '../../../.storybook/fixtures.ts';
import { mockApi } from '../../../.storybook/api-fixture.ts';

const meta = {
  title: 'Forms/Independent targets',
  component: GoalForm,
  args: { state: sampleState, goal: sampleState.goals[0] },
  beforeEach: () => mockApi()
} satisfies Meta<typeof GoalForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ExistingTarget: Story = {};
export const NewTarget: Story = { args: { goal: undefined } };
export const ConsecutiveTargets: Story = {
  args: { goal: undefined },
  play: async ({ canvas, userEvent }) => {
    for (const name of ['First build', 'Alternate build']) {
      await userEvent.type(canvas.getByLabelText('Target name'), name);
      await userEvent.selectOptions(
        canvas.getByRole('combobox', { name: /^Character or weapon instance/ }),
        'character:10000000-0000-4000-8000-000000000002'
      );
      await userEvent.click(canvas.getByRole('button', { name: 'Save target' }));
      await expect(canvas.getByRole('status')).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Save target' })).toBeEnabled();
      await expect(canvas.getByLabelText('Target level')).toHaveValue(90);
      await expect(canvas.getByLabelText('Target ascension')).toHaveValue(6);
    }
    await expect(window.fetch).toHaveBeenCalledTimes(2);
  }
};
export const ExplicitCompletion: Story = {
  play: async ({ canvas, userEvent }) => {
    // Given a saved target, when its completion checkbox is explicitly selected.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Mark this target completed' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save target' }));
    // Then only the target endpoint receives completion, never actual progression.
    await expect(window.fetch).toHaveBeenCalledTimes(1);
    await expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/goals/'),
      expect.objectContaining({ body: expect.stringContaining('"completed":true') })
    );
  }
};
