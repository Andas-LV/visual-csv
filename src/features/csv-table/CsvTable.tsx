"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { useCsvStore } from "@/entities/csv/useCsvStore";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Download,
	Search,
	X,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { RowDetailModal } from "./RowDetailModal";
import { exportToCsv } from "@/shared/lib/exportCsv";
import { useModal } from "@/shared/hooks/useModal";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200, 500];

/**
 * Обёртка для debounced глобального поиска —
 * локальный state для мгновенного отклика UI, debounce перед обновлением store
 */
function useDebouncedGlobalSearch() {
	const storeSearch = useCsvStore((s) => s.globalSearch);
	const setGlobalSearch = useCsvStore((s) => s.setGlobalSearch);
	const [localSearch, setLocalSearch] = useState(storeSearch);
	const debouncedSearch = useDebounce(localSearch, 300);

	useEffect(() => {
		setGlobalSearch(debouncedSearch);
	}, [debouncedSearch, setGlobalSearch]);

	// Синхронизация при сбросе фильтров извне (clearFilters)
	useEffect(() => {
		setLocalSearch(storeSearch);
	}, [storeSearch]);

	return { localSearch, setLocalSearch };
}

/**
 * Debounced колоночный фильтр — локальный state + задержка перед обновлением store
 */
function DebouncedColumnFilter({
	column,
	value,
	onChange,
}: {
	column: string;
	value: string;
	onChange: (col: string, val: string) => void;
}) {
	const [localValue, setLocalValue] = useState(value);
	const debouncedValue = useDebounce(localValue, 300);

	useEffect(() => {
		onChange(column, debouncedValue);
	}, [debouncedValue, column, onChange]);

	// Синхронизация при сбросе фильтров извне (clearFilters)
	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	return (
		<Input
			placeholder="Фильтр..."
			value={localValue}
			onChange={(e) => setLocalValue(e.target.value)}
			className="h-7 text-xs bg-background/60"
		/>
	);
}

export function CsvTable() {
	const columns = useCsvStore((s) => s.columns);
	const paginatedRows = useCsvStore((s) => s.paginatedRows);
	const totalPages = useCsvStore((s) => s.totalPages);
	const totalFilteredRows = useCsvStore((s) => s.totalFilteredRows);
	const page = useCsvStore((s) => s.page);
	const pageSize = useCsvStore((s) => s.pageSize);
	const columnFilters = useCsvStore((s) => s.columnFilters);
	const sort = useCsvStore((s) => s.sort);
	const allRows = useCsvStore((s) => s.allRows);

	const setPage = useCsvStore((s) => s.setPage);
	const setPageSize = useCsvStore((s) => s.setPageSize);
	const setColumnFilter = useCsvStore((s) => s.setColumnFilter);
	const clearFilters = useCsvStore((s) => s.clearFilters);
	const setSort = useCsvStore((s) => s.setSort);

	const { localSearch, setLocalSearch } = useDebouncedGlobalSearch();

	const stableSetColumnFilter = useCallback(
		(col: string, val: string) => setColumnFilter(col, val),
		[setColumnFilter],
	);

	const rows = paginatedRows();
	const pages = totalPages();
	const filteredCount = totalFilteredRows();

	const { modalData, openModal, closeModal } = useModal<{
		row: Record<string, string>;
		index: number;
	}>();

	const hasActiveFilters =
		localSearch.trim() !== "" ||
		Object.values(columnFilters).some((v) => v.trim() !== "");

	// Keyboard shortcuts
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			const isInput =
				target.tagName === "INPUT" || target.tagName === "TEXTAREA";

			if (isInput) return;

			if (e.key === "ArrowLeft" && page > 1) {
				e.preventDefault();
				setPage(page - 1);
			} else if (e.key === "ArrowRight" && page < pages) {
				e.preventDefault();
				setPage(page + 1);
			} else if (e.key === "Escape" && hasActiveFilters) {
				e.preventDefault();
				clearFilters();
				setLocalSearch("");
			}
		};

		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [page, pages, setPage, clearFilters, setLocalSearch, hasActiveFilters]);

	const filteredRows = useCsvStore((s) => s.filteredRows);
	const activeDatasetId = useCsvStore((s) => s.activeDatasetId);
	const datasets = useCsvStore((s) => s.datasets);

	const handleExport = useCallback(() => {
		const allFiltered = filteredRows();
		const dataset = datasets.find((d) => d.id === activeDatasetId);
		const name = dataset?.name ?? "export";
		const suffix = hasActiveFilters ? "_filtered" : "";
		exportToCsv(columns, allFiltered, `${name}${suffix}`);
	}, [filteredRows, columns, datasets, activeDatasetId, hasActiveFilters]);

	if (columns.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col gap-4" id="csv-table-container">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="relative flex-1 min-w-[200px] max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						id="csv-global-search"
						placeholder="Поиск по всем колонкам..."
						value={localSearch}
						onChange={(e) => setLocalSearch(e.target.value)}
						className="pl-9 h-9"
					/>
				</div>

				<div className="flex items-center gap-2">
					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								clearFilters();
								setLocalSearch("");
							}}
							className="h-9 text-xs"
							id="csv-clear-filters"
						>
							<X className="mr-1 h-3 w-3" />
							Сбросить
						</Button>
					)}

					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						className="h-9 text-xs"
						id="csv-export"
					>
						<Download className="mr-1.5 h-3.5 w-3.5" />
						Экспорт{hasActiveFilters ? ` (${filteredCount})` : ""}
					</Button>

					<p className="text-xs text-muted-foreground whitespace-nowrap">
						{filteredCount} из {allRows.length} строк
					</p>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-lg border border-border bg-card overflow-hidden">
				<div className="overflow-auto max-h-[calc(100vh-320px)]">
					<Table>
						<TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
							<TableRow className="hover:bg-transparent">
								<TableHead className="w-[60px] text-center text-xs font-semibold text-muted-foreground sticky left-0 bg-muted/80 backdrop-blur-sm z-20">
									#
								</TableHead>
								{columns.map((col) => (
									<TableHead key={col}>
										<div className="flex flex-col gap-1.5 py-1">
											<button
												type="button"
												onClick={() => setSort(col)}
												className="flex items-center gap-1.5 text-xs font-semibold hover:text-foreground transition-colors"
											>
												<span className="truncate max-w-[150px]">{col}</span>
												<SortIcon column={col} sort={sort} />
											</button>
											<DebouncedColumnFilter
												column={col}
												value={columnFilters[col] ?? ""}
												onChange={stableSetColumnFilter}
											/>
										</div>
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={columns.length + 1}
										className="h-24 text-center text-muted-foreground"
									>
										{hasActiveFilters
											? "Нет строк, соответствующих фильтрам"
											: "Нет данных"}
									</TableCell>
								</TableRow>
							) : (
								rows.map((row, idx) => {
									const rowNum = (page - 1) * pageSize + idx;
									return (
										<TableRow
											key={`row-${rowNum}`}
											className="group cursor-pointer"
											onClick={() => openModal({ row, index: rowNum })}
										>
											<TableCell className="text-center text-xs text-muted-foreground font-mono sticky left-0 bg-card group-hover:bg-muted/50 transition-colors z-10">
												{rowNum + 1}
											</TableCell>
											{columns.map((col) => (
												<TableCell
													key={`${col}-${rowNum}`}
													className="max-w-[300px] truncate text-sm"
													title={row[col]}
												>
													{row[col]}
												</TableCell>
											))}
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			{/* Row Detail Modal */}
			<RowDetailModal
				open={modalData !== null}
				onOpenChange={(open) => {
					if (!open) closeModal();
				}}
				row={modalData?.row ?? null}
				rowIndex={modalData?.index ?? null}
				columns={columns}
			/>

			{/* Pagination */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<span className="text-xs text-muted-foreground whitespace-nowrap">
						Строк на странице
					</span>
					<Select
						value={String(pageSize)}
						onValueChange={(val) => setPageSize(Number(val))}
					>
						<SelectTrigger className="h-8 w-[70px]" id="csv-page-size-select">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PAGE_SIZE_OPTIONS.map((opt) => (
								<SelectItem key={opt} value={String(opt)}>
									{opt}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => setPage(1)}
						disabled={page <= 1}
						id="csv-page-first"
					>
						<ChevronsLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => setPage(page - 1)}
						disabled={page <= 1}
						id="csv-page-prev"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>

					<span className="px-3 text-xs text-muted-foreground whitespace-nowrap">
						Стр. {page} из {pages}
					</span>

					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => setPage(page + 1)}
						disabled={page >= pages}
						id="csv-page-next"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => setPage(pages)}
						disabled={page >= pages}
						id="csv-page-last"
					>
						<ChevronsRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function SortIcon({
	column,
	sort,
}: {
	column: string;
	sort: { column: string; direction: "asc" | "desc" | null } | null;
}) {
	if (sort?.column !== column || !sort.direction) {
		return (
			<ArrowUpDown
				className={cn(
					"h-3 w-3 shrink-0 text-muted-foreground/50 transition-opacity",
				)}
			/>
		);
	}

	return sort.direction === "asc" ? (
		<ArrowUp className="h-3 w-3 shrink-0 text-primary" />
	) : (
		<ArrowDown className="h-3 w-3 shrink-0 text-primary" />
	);
}
