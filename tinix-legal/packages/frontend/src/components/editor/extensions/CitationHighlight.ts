import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface CitationMatch {
  text: string;
  from: number;
  to: number;
  status: 'VALID' | 'EXPIRED' | 'AMENDED' | 'UNKNOWN';
  notes?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citationHighlight: {
      setCitations: (citations: CitationMatch[]) => ReturnType;
      clearCitations: () => ReturnType;
    };
  }
}

export const CitationHighlightPluginKey = new PluginKey('citationHighlight');

export const CitationHighlight = Extension.create({
  name: 'citationHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: CitationHighlightPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            const citations = tr.getMeta(CitationHighlightPluginKey);
            if (citations) {
              return citations;
            }
            return oldState.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      setCitations: (citations: CitationMatch[]) => ({ tr, dispatch }: any) => {
        if (dispatch) {
          const decorations = citations.map((c) => {
            let className = 'citation-valid';
            if (c.status === 'EXPIRED') className = 'citation-expired';
            if (c.status === 'AMENDED') className = 'citation-amended';
            
            return Decoration.inline(c.from, c.to, { class: className }, { citation: c });
          });
          
          const decoSet = DecorationSet.create(tr.doc, decorations);
          tr.setMeta(CitationHighlightPluginKey, decoSet);
        }
        return true;
      },
      clearCitations: () => ({ tr, dispatch }: any) => {
        if (dispatch) {
          tr.setMeta(CitationHighlightPluginKey, DecorationSet.empty);
        }
        return true;
      },
    } as any;
  },
});
