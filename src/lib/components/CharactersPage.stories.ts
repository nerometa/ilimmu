import type { Meta, StoryObj } from '@storybook/sveltekit';
import CharactersPage from './CharactersPage.svelte';
import { sampleState } from '../../../.storybook/fixtures.ts';
const meta={title:'Screens/Characters',component:CharactersPage,args:{state:sampleState}} satisfies Meta<typeof CharactersPage>;
export default meta;
type Story=StoryObj<typeof meta>;
export const Roster:Story={};
export const Unowned:Story={args:{state:{...sampleState,characters:[],builds:[]}}};
