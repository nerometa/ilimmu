import type { Meta, StoryObj } from '@storybook/sveltekit';
import FilterOptions from './FilterOptions.svelte';

const meta = { title: 'Components/Roster filters', component: FilterOptions, parameters: { layout: 'padded' } } satisfies Meta<typeof FilterOptions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = { args: { elements: ['Hydro'], rarities: [5], weapons: ['Sword'] } };
export const WeaponRarity: Story = { args: { showElements: false, showWeapons: false, rarityChoices: [5, 4, 3, 2, 1], rarities: [4] } };
