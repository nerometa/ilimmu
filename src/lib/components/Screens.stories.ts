import type { Meta, StoryObj } from '@storybook/sveltekit';
import { expect } from 'storybook/test';
import ScreenHarness from '../../../.storybook/ScreenHarness.svelte';
import { mockApi } from '../../../.storybook/api-fixture';

const meta = {
  title: 'Screens/Full application',
  component: ScreenHarness,
  parameters: { layout: 'fullscreen' },
  args: { screen: 'characters' }
} satisfies Meta<typeof ScreenHarness>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Characters: Story = {};
export const Login: Story = { args: { screen: 'login' } };
export const RejectedSignIn: Story = {
  args: { screen: 'login' },
  beforeEach: () => mockApi(),
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Email'), 'owner@example.test');
    await userEvent.type(canvas.getByLabelText('Password'), 'incorrect-password');
    await userEvent.click(canvas.getByRole('button', { name: /^Sign in$/ }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    await expect(canvas.queryByRole('link', { name: 'Open sign-in in a new tab' })).not.toBeInTheDocument();
    await expect(canvas.getByLabelText('Email')).toHaveValue('owner@example.test');
    await expect(canvas.getByLabelText('Password')).toHaveValue('incorrect-password');
  }
};
export const Profile: Story = { args: { screen: 'profile' } };
export const Weapons: Story = { args: { screen: 'weapons' } };
export const Inventory: Story = { args: { screen: 'inventory' } };
export const Goals: Story = { args: { screen: 'goals' } };
export const Conflicts: Story = { args: { screen: 'conflicts' } };
export const Export: Story = { args: { screen: 'export' } };
