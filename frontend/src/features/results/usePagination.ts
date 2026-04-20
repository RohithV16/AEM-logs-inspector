import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PaginationState {
  page: number;
  perPage: number;
  total: number;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export const usePaginationStore = create<PaginationState>()(
  persist(
    (set, get) => ({
      page: 1,
      perPage: parseInt(localStorage.getItem('aem_rawEventsPerPage') || '50'),
      total: 0,
      setPage: (page) => set({ page }),
      setPerPage: (perPage) => {
        localStorage.setItem('aem_rawEventsPerPage', String(perPage));
        set({ perPage, page: 1 });
      },
      setTotal: (total) => set({ total }),
      nextPage: () => {
        const { page, perPage, total } = get();
        if (page * perPage < total) set({ page: page + 1 });
      },
      prevPage: () => {
        const { page } = get();
        if (page > 1) set({ page: page - 1 });
      },
    }),
    { name: 'aem-pagination' }
  )
);