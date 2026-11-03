import type { Preview } from '@storybook/sveltekit';
import '../src/app.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    a11y: { test: 'error' },
    backgrounds: { options: { navy: { name: 'Navy', value: '#101827' } } }
  },
  initialGlobals: { backgrounds: { value: 'navy' } }
};

export default preview;
