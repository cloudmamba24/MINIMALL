import type { StorybookConfig } from '@storybook/react-vite';

import { join, dirname } from "path"

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../apps/admin/src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../apps/public/src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  "addons": [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions'),
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-onboarding')
  ],
  "framework": {
    "name": getAbsolutePath('@storybook/react-vite'),
    "options": {}
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  viteFinal: async (config) => {
    // Add path mapping for our monorepo
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@minimall/core': '../packages/core/src',
        '@minimall/ui': '../packages/ui/src',
        '@minimall/db': '../packages/db/src',
        '@repo/core': '../packages/core/src',
        '@repo/ui': '../packages/ui/src', 
        '@repo/db': '../packages/db/src',
      };
    }
    return config;
  },
};
export default config;