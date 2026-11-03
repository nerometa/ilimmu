import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
  stories: ['../src/lib/components/**/*.stories.ts'],
  addons: ['@storybook/addon-a11y'],
  framework: { name: '@storybook/sveltekit', options: {} },
  core: { disableTelemetry: true }
};

export default config;
