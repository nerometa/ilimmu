import type { Meta, StoryObj } from '@storybook/sveltekit';
import { expect, fn } from 'storybook/test';
import Notice from './Notice.svelte';

const meta = {
  title: 'Feedback/Request states',
  component: Notice,
  args: { message: 'Your last saved data is preserved.', onreview: fn() }
} satisfies Meta<typeof Notice>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Error: Story = {};
export const Loading: Story = { args: { pending: true } };
export const Stale: Story = {
  args: { stale: true, message: 'This record changed in another session.' },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Reload saved records for review' }));
    await expect(args.onreview).toHaveBeenCalledTimes(1);
  }
};
