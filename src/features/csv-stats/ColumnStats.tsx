"use client";

import React, { useMemo, useState } from "react";
import { useCsvStore } from "@/entities/csv/useCsvStore";
import { BarChart3, ChevronDown, ChevronUp, Hash } from "lucide-react";

interface NumericColumnStat {
	name: string;
	uniqueCount: number;
	emptyCount: number;
	min: number;
	max: number;
	avg: number;
	sum: number;
}

function computeNumericStats(
	columns: string[],
	rows: Record<string, string>[],
): NumericColumnStat[] {
	const result: NumericColumnStat[] = [];

	for (const col of columns) {
		const values = rows.map((r) => r[col] ?? "");
		const nonEmpty = values.filter((v) => v.trim() !== "");
		const emptyCount = values.length - nonEmpty.length;

		const numericValues: number[] = [];
		for (const v of nonEmpty) {
			const n = Number(v.replace(/\s/g, "").replace(",", "."));
			if (!Number.isNaN(n)) numericValues.push(n);
		}

		// Только если >60% значений — числа
		if (nonEmpty.length > 0 && numericValues.length / nonEmpty.length > 0.6) {
			const min = Math.min(...numericValues);
			const max = Math.max(...numericValues);
			const sum = numericValues.reduce((a, b) => a + b, 0);
			const avg = sum / numericValues.length;

			result.push({
				name: col,
				uniqueCount: new Set(nonEmpty).size,
				emptyCount,
				min,
				max,
				avg,
				sum,
			});
		}
	}

	return result;
}

export function ColumnStats() {
	const columns = useCsvStore((s) => s.columns);
	const allRows = useCsvStore((s) => s.allRows);
	const [isOpen, setIsOpen] = useState(false);

	const stats = useMemo(
		() => computeNumericStats(columns, allRows),
		[columns, allRows],
	);

	// Не показываем если нет числовых колонок
	if (stats.length === 0) return null;

	return (
		<div className="rounded-lg border border-border bg-card">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent/30 transition-colors rounded-lg"
			>
				<div className="flex items-center gap-2">
					<BarChart3 className="h-4 w-4 text-muted-foreground" />
					<span>Числовая статистика</span>
					<span className="text-xs text-muted-foreground font-normal">
						({stats.length} колонок)
					</span>
				</div>
				{isOpen ? (
					<ChevronUp className="h-4 w-4 text-muted-foreground" />
				) : (
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				)}
			</button>

			{isOpen && (
				<div className="border-t border-border px-4 py-3">
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
						{stats.map((stat) => (
							<StatCard
								key={stat.name}
								stat={stat}
								totalRows={allRows.length}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function StatCard({
	stat,
	totalRows,
}: {
	stat: NumericColumnStat;
	totalRows: number;
}) {
	const fillPercent =
		totalRows > 0 ? ((totalRows - stat.emptyCount) / totalRows) * 100 : 0;

	return (
		<div className="rounded-md border border-border p-3 bg-background/50 hover:bg-accent/20 transition-colors">
			<div className="flex items-center gap-2 mb-2">
				<Hash className="h-3.5 w-3.5 text-blue-500" />
				<p className="text-xs font-semibold truncate flex-1" title={stat.name}>
					{stat.name}
				</p>
			</div>

			<div className="space-y-1 text-[11px] text-muted-foreground">
				<div className="flex justify-between">
					<span>Мин / Макс</span>
					<span className="font-mono text-foreground">
						{stat.min.toLocaleString()} / {stat.max.toLocaleString()}
					</span>
				</div>
				<div className="flex justify-between">
					<span>Среднее</span>
					<span className="font-mono text-foreground">
						{stat.avg.toLocaleString(undefined, {
							maximumFractionDigits: 2,
						})}
					</span>
				</div>
				<div className="flex justify-between">
					<span>Сумма</span>
					<span className="font-mono text-foreground">
						{stat.sum.toLocaleString(undefined, {
							maximumFractionDigits: 2,
						})}
					</span>
				</div>
				<div className="flex justify-between">
					<span>Заполнено</span>
					<span className="font-mono text-foreground">
						{fillPercent.toFixed(0)}%
					</span>
				</div>
			</div>

			{/* Fill bar */}
			<div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
				<div
					className="h-full rounded-full transition-all bg-blue-500/60"
					style={{ width: `${fillPercent}%` }}
				/>
			</div>
		</div>
	);
}
