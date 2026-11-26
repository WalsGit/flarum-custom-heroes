/**
 * Drag and drop of a list's rows by a handle, with core's sortablejs chunk
 * (lazy-loaded, like Flarum's own pages). `onmove` reorders the data.
 */
export function makeSortable(list: HTMLElement, handle: string, onmove: (from: number, to: number) => void): void {
  import('flarum/admin/utils/loadSortable').then(({ default: Sortable }) => {
    if (!list.isConnected) return;

    Sortable.create(list, {
      handle,
      animation: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150,
      ghostClass: 'wch-Sortable-ghost',
      onEnd: ({ item, from, oldIndex, newIndex }: { item: HTMLElement; from: HTMLElement; oldIndex?: number; newIndex?: number }) => {
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;

        // Put the row back where Mithril left it, then reorder the data: Mithril redraws the list.
        from.insertBefore(item, from.children[oldIndex + (oldIndex > newIndex ? 1 : 0)] ?? null);
        onmove(oldIndex, newIndex);
        m.redraw();
      },
    });
  });
}

/** The list with one item moved. */
export function moved<T>(items: T[], from: number, to: number): T[] {
  const copy = [...items];
  copy.splice(to, 0, ...copy.splice(from, 1));

  return copy;
}
