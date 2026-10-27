// The stack rule examples run against unless they override it.

const SHADCN_COMPONENTS = ['button', 'calendar', 'checkbox', 'combobox', 'field', 'input', 'label', 'native-select', 'popover', 'radio-group', 'select', 'switch', 'textarea', 'toggle-group'];

export function fixtureStack(platform = 'web', overrides = {}) {
  const base = platform === 'native'
    ? {
      root: '/fixture', ui: 'heroui-native', uiPro: false, base: null, platform: 'native', formLib: 'react-hook-form',
      validation: 'zod', versions: {}, components: new Set(), hasDatePicker: false, hasSelect: true,
      vendorTools: { shadcnCli: false, herouiMcpInProject: false },
    }
    : {
      root: '/fixture', ui: 'shadcn', uiPro: false, base: 'radix', platform: 'web', formLib: 'react-hook-form',
      validation: 'zod', versions: {}, components: new Set(SHADCN_COMPONENTS), hasDatePicker: true, hasSelect: true,
      vendorTools: { shadcnCli: true, herouiMcpInProject: false },
    };
  const stack = { ...base, ...overrides };
  if (Array.isArray(overrides.components)) stack.components = new Set(overrides.components);
  return stack;
}
