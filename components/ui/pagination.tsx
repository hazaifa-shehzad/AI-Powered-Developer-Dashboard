import React from 'react';

interface PaginationProps {
  page: number;
  perPage: number;
  total?: number;
  onPageChange: (next: number) => void;
}

export function Pagination({ page, perPage, total, onPageChange }: PaginationProps) {
  const totalPages = total ? Math.max(1, Math.ceil(total / perPage)) : undefined;

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="text-sm text-zinc-500 dark:text-zinc-400">{total ? `${total} items` : ''}</div>

      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex h-8 items-center justify-center rounded-md border border-transparent bg-zinc-100 px-3 text-sm text-zinc-700 disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-200"
        >
          Prev
        </button>

        {totalPages ? (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{page} / {totalPages}</span>
        ) : (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Page {page}</span>
        )}

        <button
          type="button"
          onClick={() => onPageChange((totalPages ? Math.min(totalPages, page + 1) : page + 1))}
          disabled={totalPages ? page >= totalPages : false}
          className="inline-flex h-8 items-center justify-center rounded-md border border-transparent bg-zinc-100 px-3 text-sm text-zinc-700 disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
