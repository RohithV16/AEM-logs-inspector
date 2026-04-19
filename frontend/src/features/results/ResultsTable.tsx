import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LevelFilter } from './LevelFilter';
import { SearchInput } from './SearchInput';
import { usePaginationStore } from './usePagination';

interface LogEvent {
  id: string;
  timestamp: string;
  level: string;
  message: string;
}

interface EventsResponse {
  events: LogEvent[];
  counts: { ALL: number; ERROR: number; WARN: number; INFO: number };
}

export function ResultsTable() {
  const { page, perPage, nextPage, prevPage } = usePaginationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [level, setLevel] = useState<string>('ALL');

  const { data } = useQuery<EventsResponse>({
    queryKey: ['rawEvents', page, perPage, searchQuery, level],
    queryFn: () =>
      fetch(`/api/events?page=${page}&perPage=${perPage}&q=${searchQuery}&level=${level}`).then((r) =>
        r.json()
      ),
  });

  return (
    <div className="results-table">
      <LevelFilter counts={data?.counts || { ALL: 0, ERROR: 0, WARN: 0, INFO: 0 }} />
      <SearchInput onSearch={(q) => setSearchQuery(q)} />
      <table>
        <tbody>
          {(data?.events || []).map((event: LogEvent) => (
            <tr key={event.id}>
              <td>{event.timestamp}</td>
              <td>{event.level}</td>
              <td>{event.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={prevPage} disabled={page === 1}>
          Prev
        </button>
        <span>Page {page}</span>
        <button onClick={nextPage}>Next</button>
      </div>
    </div>
  );
}