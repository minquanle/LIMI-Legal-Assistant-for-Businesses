import { Mark, mergeAttributes } from '@tiptap/core';

export const TrackChangeAdd = Mark.create({
  name: 'trackChangeAdd',

  parseHTML() {
    return [{ tag: 'ins' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['ins', mergeAttributes(HTMLAttributes, { class: 'text-green-600 bg-green-50 no-underline border-b-2 border-green-600' }), 0];
  },
});

export const TrackChangeDelete = Mark.create({
  name: 'trackChangeDelete',

  parseHTML() {
    return [{ tag: 'del' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['del', mergeAttributes(HTMLAttributes, { class: 'text-red-500 bg-red-50 line-through' }), 0];
  },
});
