import { useCallback, useEffect, useState } from 'react';
import { deleteDocument, listRecent, type RecentDocument } from '@wepo/core';

export function useRecentDocuments(limit = 8) {
  const [documents, setDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setDocuments(await listRecent(limit));
      setError(null);
    } catch {
      setError('Local document history is unavailable in this browser.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteDocument(id);
      } finally {
        await refresh();
      }
    },
    [refresh],
  );

  return { documents, loading, error, refresh, remove };
}
