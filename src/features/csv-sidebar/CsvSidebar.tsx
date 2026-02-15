"use client";

import React from "react";
import { useCsvStore } from "@/entities/csv/useCsvStore";
import { Button } from "@/shared/components/ui/button";
import { Database, FileSpreadsheet, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function CsvSidebar() {
	const datasets = useCsvStore((s) => s.datasets);
	const activeDatasetId = useCsvStore((s) => s.activeDatasetId);
	const selectDataset = useCsvStore((s) => s.selectDataset);
	const removeDataset = useCsvStore((s) => s.removeDataset);

	if (datasets.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
					<Database className="h-5 w-5 text-muted-foreground" />
				</div>
				<div>
					<p className="text-sm font-medium text-muted-foreground">
						Нет загруженных файлов
					</p>
					<p className="mt-0.5 text-xs text-muted-foreground/70">
						Загрузите CSV файл выше
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1.5" id="csv-dataset-list">
			<p className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
				Сохранённые файлы ({datasets.length})
			</p>
			{datasets.map((ds) => {
				const isActive = ds.id === activeDatasetId;

				return (
					<div
						key={ds.id}
						className={cn(
							"group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 cursor-pointer",
							"hover:bg-accent/50",
							isActive && "bg-primary/10 border border-primary/20",
						)}
						role="button"
						tabIndex={0}
						onClick={() => selectDataset(ds.id)}
						onKeyDown={(e) => {
							if (e.key === "Enter") selectDataset(ds.id);
						}}
					>
						<div
							className={cn(
								"flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors",
								isActive
									? "bg-primary/15 text-primary"
									: "bg-muted text-muted-foreground",
							)}
						>
							<FileSpreadsheet className="h-4 w-4" />
						</div>

						<div className="flex-1 min-w-0">
							<p
								className={cn(
									"text-sm font-medium truncate",
									isActive && "text-primary",
								)}
							>
								{ds.name}
							</p>
							<p className="text-[11px] text-muted-foreground">
								{ds.rowCount.toLocaleString()} строк •{" "}
								{ds.columns.length} колонок
							</p>
						</div>

						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
							onClick={(e) => {
								e.stopPropagation();
								removeDataset(ds.id);
							}}
							id={`csv-delete-${ds.id}`}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				);
			})}
		</div>
	);
}
