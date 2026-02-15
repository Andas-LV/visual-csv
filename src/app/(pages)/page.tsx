"use client";

import React, { useEffect } from "react";
import { useCsvStore } from "@/entities/csv/useCsvStore";
import { CsvUpload } from "@/features/csv-upload/CsvUpload";
import { CsvTable } from "@/features/csv-table/CsvTable";
import { CsvSidebar } from "@/features/csv-sidebar/CsvSidebar";
import { FileSpreadsheet } from "lucide-react";
import { ThemeToggle } from "@/shared/components/ThemeToggle/ThemeToggle";
import { ColumnStats } from "@/features/csv-stats/ColumnStats";
import { CsvChart } from "@/features/csv-chart/CsvChart";

export default function Home() {
	const loadDatasets = useCsvStore((s) => s.loadDatasets);
	const activeDatasetId = useCsvStore((s) => s.activeDatasetId);
	const error = useCsvStore((s) => s.error);

	useEffect(() => {
		loadDatasets();
	}, [loadDatasets]);

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
				<div className="mx-auto max-w-[1600px] px-6 py-4 flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
						<FileSpreadsheet className="h-5 w-5" />
					</div>
					<div className="flex-1">
						<h1 className="text-lg font-bold tracking-tight">Visual CSV</h1>
						<p className="text-xs text-muted-foreground">
							Визуализация и анализ CSV файлов
						</p>
					</div>
					<ThemeToggle />
				</div>
			</header>

			{/* Content */}
			<div className="mx-auto max-w-[1600px] px-6 py-6">
				{error && (
					<div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						{error}
					</div>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
					{/* Sidebar */}
					<aside className="flex flex-col gap-4">
						<CsvUpload />
						<CsvSidebar />
					</aside>

					{/* Main Table Area */}
					<main className="min-w-0 flex flex-col gap-4">
						{activeDatasetId ? (
							<>
								<ColumnStats />
								<CsvChart />
								<CsvTable />
							</>
						) : (
							<EmptyState />
						)}
					</main>
				</div>
			</div>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
			<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
				<FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
			</div>
			<div>
				<h2 className="text-xl font-semibold text-foreground">
					Выберите или загрузите CSV
				</h2>
				<p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
					Перетащите CSV файл в зону загрузки слева или выберите ранее
					сохранённый файл
				</p>
			</div>
		</div>
	);
}
