import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface RedlineSuggestion {
  id: string;
  from: number;
  to: number;
  originalText: string;
  suggestedText: string;
  reason: string;
}

export interface AutoRedlineOptions {
  HTMLAttributes: Record<string, any>;
  onRedlineClick?: (suggestion: RedlineSuggestion, event: MouseEvent) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    autoRedline: {
      setRedlines: (suggestions: RedlineSuggestion[]) => ReturnType;
      clearRedlines: () => ReturnType;
      acceptRedline: (id: string) => ReturnType;
    };
  }
}

export const AutoRedlinePluginKey = new PluginKey('autoRedline');

export const AutoRedline = Extension.create<AutoRedlineOptions>({
  name: 'autoRedline',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'auto-redline-decoration',
      },
      onRedlineClick: undefined,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: AutoRedlinePluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            // Lấy meta data từ transaction nếu có setRedlines
            const redlines = tr.getMeta(AutoRedlinePluginKey);
            if (redlines) {
              return redlines;
            }
            
            // Map decorations khi document thay đổi
            return oldState.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          handleClick(view, pos, event) {
            const state = this.getState(view.state);
            if (!state) return false;
            
            const decorations = state.find(pos, pos);
            if (decorations.length > 0) {
              const deco = decorations[0];
              const suggestion = deco.spec.suggestion as RedlineSuggestion;
              
              if (this.spec.options?.onRedlineClick) {
                this.spec.options.onRedlineClick(suggestion, event);
                return true;
              }
            }
            return false;
          }
        },
      }),
    ];
  },

  addCommands() {
    return {
      setRedlines: (suggestions: RedlineSuggestion[]) => ({ tr, dispatch }: any) => {
        if (dispatch) {
          const decorations = suggestions.map((s) => {
            return Decoration.inline(s.from, s.to, this.options.HTMLAttributes, {
              suggestion: s,
            });
          });
          
          const decoSet = DecorationSet.create(tr.doc, decorations);
          tr.setMeta(AutoRedlinePluginKey, decoSet);
        }
        return true;
      },
      clearRedlines: () => ({ tr, dispatch }: any) => {
        if (dispatch) {
          tr.setMeta(AutoRedlinePluginKey, DecorationSet.empty);
        }
        return true;
      },
      acceptRedline: (id: string) => ({ tr, dispatch, state }: any) => {
        const pluginState = AutoRedlinePluginKey.getState(state) as DecorationSet;
        if (!pluginState) return false;
        
        const decorations = pluginState.find();
        const targetDeco = decorations.find((d: any) => d.spec.suggestion.id === id);
        
        if (targetDeco && dispatch) {
          const suggestion = targetDeco.spec.suggestion as RedlineSuggestion;
          
          // Thay thế text
          tr.replaceWith(targetDeco.from, targetDeco.to, state.schema.text(suggestion.suggestedText));
          
          // Xóa decoration này khỏi set bằng cách tạo set mới
          const remainingDecos = decorations.filter((d: any) => d.spec.suggestion.id !== id);
          const newDecoSet = DecorationSet.create(tr.doc, remainingDecos);
          tr.setMeta(AutoRedlinePluginKey, newDecoSet);
        }
        return true;
      }
    } as any;
  },
});
