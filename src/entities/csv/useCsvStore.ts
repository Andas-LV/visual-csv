import { create } from "zustand";
import {
	type CsvDataset,
	deleteDataset,
	getAllDatasets,
	getDatasetRows,
	saveDataset,
} from "@/shared/lib/indexedDb";
import { parseCsv, readFileAsText } from "@/shared/lib/csvParser";

export type SortDirection = "asc" | "desc" | null;

interface SortConfig {
	column: string;
	direction: SortDirection;
}

interface CsvState {
	// Список всех датасетов
	datasets: CsvDataset[];
	activeDatasetId: string | null;

	// Данные активного датасета
	columns: string[];
	allRows: Record<string, string>[];

	// Пагинация
	page: number;
	pageSize: number;

	// Поиск и фильтры
	globalSearch: string;
	columnFilters: Record<string, string>;

	// Сортировка
	sort: SortConfig | null;

	// UI
	isLoading: boolean;
	importProgress: number;
	error: string | null;

	// Computed
	filteredRows: () => Record<string, string>[];
	paginatedRows: () => Record<string, string>[];
	totalPages: () => number;
	totalFilteredRows: () => number;

	// Actions
	loadDatasets: () => Promise<void>;
	importCsvFile: (file: File) => Promise<void>;
	selectDataset: (id: string) => Promise<void>;
	removeDataset: (id: string) => Promise<void>;

	setPage: (page: number) => void;
	setPageSize: (size: number) => void;
	setGlobalSearch: (search: string) => void;
	setColumnFilter: (column: string, value: string) => void;
	clearFilters: () => void;
	setSort: (column: string) => void;
}

export const useCsvStore = create<CsvState>()((set, get) => ({
	datasets: [],
	activeDatasetId: null,
	columns: [],
	allRows: [],

	page: 1,
	pageSize: 20,

	globalSearch: "",
	columnFilters: {},

	sort: null,

	isLoading: false,
	importProgress: 0,
	error: null,

	filteredRows: () => {
		const { allRows, globalSearch, columnFilters, sort } = get();
		let result = [...allRows];

		// Глобальный поиск
		if (globalSearch.trim()) {
			const query = globalSearch.toLowerCase();
			result = result.filter((row) =>
				Object.values(row).some((val) => val.toLowerCase().includes(query)),
			);
		}

		// Колоночные фильтры
		for (const [col, filter] of Object.entries(columnFilters)) {
			if (!filter.trim()) continue;
			const query = filter.toLowerCase();
			result = result.filter((row) =>
				(row[col] ?? "").toLowerCase().includes(query),
			);
		}

		// Сортировка
		if (sort?.column && sort.direction) {
			const { column, direction } = sort;
			result.sort((a, b) => {
				const valA = a[column] ?? "";
				const valB = b[column] ?? "";

				// Попробуем сравнить как числа
				const numA = Number(valA);
				const numB = Number(valB);

				if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
					return direction === "asc" ? numA - numB : numB - numA;
				}

				return direction === "asc"
					? valA.localeCompare(valB)
					: valB.localeCompare(valA);
			});
		}

		return result;
	},

	paginatedRows: () => {
		const { page, pageSize, filteredRows } = get();
		const rows = filteredRows();
		const start = (page - 1) * pageSize;
		return rows.slice(start, start + pageSize);
	},

	totalPages: () => {
		const { pageSize, filteredRows } = get();
		return Math.max(1, Math.ceil(filteredRows().length / pageSize));
	},

	totalFilteredRows: () => {
		return get().filteredRows().length;
	},

	loadDatasets: async () => {
		set({ isLoading: true, error: null });
		try {
			const datasets = await getAllDatasets();
			set({ datasets });
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : "Ошибка загрузки данных",
			});
		} finally {
			set({ isLoading: false });
		}
	},

	importCsvFile: async (file: File) => {
		const delay = (ms: number) =>
			new Promise<void>((r) => setTimeout(r, ms));

		set({ isLoading: true, importProgress: 0, error: null });
		try {
			// Этап 1: Чтение файла
			set({ importProgress: 5 });
			await delay(200);
			set({ importProgress: 15 });
			const text = await readFileAsText(file);
			set({ importProgress: 30 });
			await delay(300);

			// Этап 2: Парсинг CSV
			set({ importProgress: 40 });
			await delay(200);
			const { headers, rows } = await new Promise<{
				headers: string[];
				rows: Record<string, string>[];
			}>((resolve) => {
				setTimeout(() => {
					resolve(parseCsv(text));
				}, 0);
			});
			set({ importProgress: 60 });
			await delay(300);

			if (headers.length === 0) {
				throw new Error("CSV файл пуст или не содержит заголовков");
			}

			// Этап 3: Сохранение в IndexedDB
			set({ importProgress: 70 });
			await delay(200);
			const id = `csv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
			const dataset: CsvDataset = {
				id,
				name: file.name.replace(/\.csv$/i, ""),
				createdAt: Date.now(),
				rowCount: rows.length,
				columns: headers,
			};

			set({ importProgress: 80 });
			await saveDataset(dataset, rows);
			set({ importProgress: 90 });
			await delay(300);
			set({ importProgress: 95 });
			await delay(200);

			set((state) => ({
				datasets: [...state.datasets, dataset],
				activeDatasetId: id,
				columns: headers,
				allRows: rows,
				page: 1,
				globalSearch: "",
				columnFilters: {},
				sort: null,
				importProgress: 100,
			}));
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : "Ошибка импорта",
			});
		} finally {
			// Даём анимации 100% побыть видимой
			await delay(600);
			set({ isLoading: false, importProgress: 0 });
		}
	},

	selectDataset: async (id: string) => {
		set({ isLoading: true, error: null });
		try {
			const dataset = get().datasets.find((d) => d.id === id);
			if (!dataset) throw new Error("Датасет не найден");

			const rows = await getDatasetRows(id);

			set({
				activeDatasetId: id,
				columns: dataset.columns,
				allRows: rows,
				page: 1,
				globalSearch: "",
				columnFilters: {},
				sort: null,
			});
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : "Ошибка загрузки датасета",
			});
		} finally {
			set({ isLoading: false });
		}
	},

	removeDataset: async (id: string) => {
		set({ isLoading: true, error: null });
		try {
			await deleteDataset(id);
			const { activeDatasetId } = get();

			set((state) => ({
				datasets: state.datasets.filter((d) => d.id !== id),
				...(activeDatasetId === id && {
					activeDatasetId: null,
					columns: [],
					allRows: [],
					page: 1,
					globalSearch: "",
					columnFilters: {},
					sort: null,
				}),
			}));
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : "Ошибка удаления",
			});
		} finally {
			set({ isLoading: false });
		}
	},

	setPage: (page: number) => set({ page }),

	setPageSize: (pageSize: number) => set({ pageSize, page: 1 }),

	setGlobalSearch: (globalSearch: string) =>
		set({ globalSearch, page: 1 }),

	setColumnFilter: (column: string, value: string) =>
		set((state) => ({
			columnFilters: { ...state.columnFilters, [column]: value },
			page: 1,
		})),

	clearFilters: () =>
		set({ globalSearch: "", columnFilters: {}, page: 1, sort: null }),

	setSort: (column: string) =>
		set((state) => {
			const current = state.sort;
			let direction: SortDirection;

			if (current?.column === column) {
				// Цикл: asc -> desc -> null
				if (current.direction === "asc") direction = "desc";
				else if (current.direction === "desc") direction = null;
				else direction = "asc";
			} else {
				direction = "asc";
			}

			return {
				sort: direction ? { column, direction } : null,
			};
		}),
}));
