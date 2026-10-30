import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineSpacing: {
      setLineSpacing: (spacing: string) => ReturnType;
      unsetLineSpacing: () => ReturnType;
    };
  }
}

export const LineSpacing = Extension.create({
  name: 'lineSpacing',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      defaultSpacing: '1.5',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineSpacing: {
            default: this.options.defaultSpacing,
            parseHTML: element => element.style.lineHeight || this.options.defaultSpacing,
            renderHTML: attributes => {
              if (attributes.lineSpacing === this.options.defaultSpacing) {
                return {};
              }
              return { style: `line-height: ${attributes.lineSpacing}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineSpacing: (spacing: string) => ({ commands }: any) => {
        return this.options.types.every((type: string) => commands.updateAttributes(type, { lineSpacing: spacing }));
      },
      unsetLineSpacing: () => ({ commands }: any) => {
        return this.options.types.every((type: string) => commands.resetAttributes(type, 'lineSpacing'));
      },
    } as any;
  },
});
