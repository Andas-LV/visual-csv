"use client";

import React, { useMemo, useState } from "react";
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from "recharts";
import { useCsvStore } from "@/entities/csv/useCsvStore";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import {
	BarChart3,
	LineChart as LineChartIcon,
	AreaChart as AreaChartIcon,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

type ChartType = "bar" | "line" | "area";

const CHART_TYPES: { value: ChartType; label: string; icon: React.ReactNode }[] = [
	{ value: "bar", label: "Столбцы", icon: <BarChart3 className="h-4 w-4" /> },
	{ value: "line", label: "Линия", icon: <LineChartIcon className="h-4 w-4" /> },
	{ value: "area", label: "Область", icon: <AreaChartIcon className="h-4 w-4" /> },
];

const COLORS = [
	"oklch(0.65 0.2 250)",
	"oklch(0.65 0.2 150)",
	"oklch(0.7 0.2 30)",
	"oklch(0.65 0.2 310)",
	"oklch(0.7 0.15 60)",
];

const MAX_DATA_POINTS = 200;

function detectNumericColumns(
	columns: string[],
	rows: Record<string, string>[],
): string[] {
	return columns.filter((col) => {
		const sample = rows.slice(0, 50);
		const numCount = sample.filter((r) => {
			const v = r[col]?.replace(/\s/g, "").replace(",", ".");
			return v !== "" && !Number.isNaN(Number(v));
		}).length;
		return numCount / Math.max(sample.length, 1) > 0.6;
	});
}

function parseNumeric(val: string): number {
	const v = val?.replace(/\s/g, "").replace(",", ".") ?? "";
	const n = Number(v);
	return Number.isNaN(n) ? 0 : n;
}

export function CsvChart() {
	const columns = useCsvStore((s) => s.columns);
	const allRows = useCsvStore((s) => s.allRows);
	const filteredRows = useCsvStore((s) => s.filteredRows);

	const [isOpen, setIsOpen] = useState(false);
	const [chartType, setChartType] = useState<ChartType>("bar");
	const [xColumn, setXColumn] = useState<string>("");
	const [yColumns, setYColumns] = useState<string[]>([]);

	const numericColumns = useMemo(
		() => detectNumericColumns(columns, allRows),
		[columns, allRows],
	);

	// Автоматическая инициализация осей при смене датасета
	const activeDatasetId = useCsvStore((s) => s.activeDatasetId);
	React.useEffect(() => {
		if (columns.length > 0) {
			// X — первая нечисловая колонка, или первая колонка
			const textCol = columns.find((c) => !numericColumns.includes(c));
			setXColumn(textCol ?? columns[0]);
			// Y — первая числовая колонка
			setYColumns(numericColumns.length > 0 ? [numericColumns[0]] : []);
		}
	}, [activeDatasetId, columns, numericColumns]);

	const chartData = useMemo(() => {
		if (!xColumn || yColumns.length === 0) return [];

		const rows = filteredRows();
		// Лимит точек данных для производительности
		const step = Math.max(1, Math.floor(rows.length / MAX_DATA_POINTS));
		const sampled = rows.filter((_, i) => i % step === 0).slice(0, MAX_DATA_POINTS);

		return sampled.map((row) => {
			const point: Record<string, string | number> = {
				[xColumn]: row[xColumn] ?? "",
			};
			for (const yCol of yColumns) {
				point[yCol] = parseNumeric(row[yCol]);
			}
			return point;
		});
	}, [xColumn, yColumns, filteredRows]);

	const toggleYColumn = (col: string) => {
		setYColumns((prev) =>
			prev.includes(col)
				? prev.filter((c) => c !== col)
				: [...prev, col].slice(0, 5),
		);
	};

	if (columns.length === 0 || numericColumns.length === 0) return null;

	return (
		<div className="rounded-lg border border-border bg-card">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent/30 transition-colors rounded-lg"
			>
				<div className="flex items-center gap-2">
					<BarChart3 className="h-4 w-4 text-muted-foreground" />
					<span>Визуализация</span>
				</div>
				{isOpen ? (
					<ChevronUp className="h-4 w-4 text-muted-foreground" />
				) : (
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				)}
			</button>

			{isOpen && (
				<div className="border-t border-border p-4 space-y-4">
					{/* Controls */}
					<div className="flex flex-wrap items-end gap-3">
						{/* Chart type */}
						<div className="flex gap-1 rounded-lg border border-border p-1 bg-muted/30">
							{CHART_TYPES.map((ct) => (
								<Button
									key={ct.value}
									variant={chartType === ct.value ? "secondary" : "ghost"}
									size="sm"
									className="h-8 px-3 text-xs gap-1.5"
									onClick={() => setChartType(ct.value)}
								>
									{ct.icon}
									{ct.label}
								</Button>
							))}
						</div>

						{/* X axis */}
						<div className="flex flex-col gap-1">
							<span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
								Ось X
							</span>
							<Select value={xColumn} onValueChange={setXColumn}>
								<SelectTrigger className="h-8 w-[160px] text-xs">
									<SelectValue placeholder="Колонка X" />
								</SelectTrigger>
								<SelectContent>
									{columns.map((col) => (
										<SelectItem key={col} value={col} className="text-xs">
											{col}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Y axis multi-select */}
						<div className="flex flex-col gap-1">
							<span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
								Ось Y (до 5)
							</span>
							<div className="flex flex-wrap gap-1">
								{numericColumns.map((col) => (
									<Button
										key={col}
										variant={yColumns.includes(col) ? "default" : "outline"}
										size="sm"
										className="h-7 px-2.5 text-[11px]"
										onClick={() => toggleYColumn(col)}
									>
										{col}
									</Button>
								))}
							</div>
						</div>
					</div>

					{/* Chart */}
					{chartData.length > 0 && yColumns.length > 0 ? (
						<div className="h-[350px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								{renderChart(chartType, chartData, xColumn, yColumns)}
							</ResponsiveContainer>
						</div>
					) : (
						<div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
							Выберите колонки для отображения графика
						</div>
					)}

					{chartData.length > 0 && (
						<p className="text-[11px] text-muted-foreground text-right">
							{chartData.length} точек данных
							{allRows.length > MAX_DATA_POINTS &&
								` (из ${allRows.length}, сэмплировано)`}
						</p>
					)}
				</div>
			)}
		</div>
	);
}

function renderChart(
	type: ChartType,
	data: Record<string, string | number>[],
	xKey: string,
	yKeys: string[],
): React.ReactElement {
	const commonProps = {
		data,
		margin: { top: 5, right: 20, left: 10, bottom: 5 },
	};

	const xAxisProps = {
		dataKey: xKey,
		tick: { fontSize: 11 },
		tickLine: false,
		axisLine: false,
		interval: Math.max(0, Math.floor(data.length / 20)),
	};

	const yAxisProps = {
		tick: { fontSize: 11 },
		tickLine: false,
		axisLine: false,
		width: 60,
	};

	const gridProps = {
		strokeDasharray: "3 3",
		opacity: 0.3,
	};

	const tooltipProps = {
		contentStyle: {
			borderRadius: "8px",
			border: "1px solid oklch(0.5 0 0 / 20%)",
			fontSize: "12px",
			padding: "8px 12px",
		},
	};

	switch (type) {
		case "bar":
			return (
				<BarChart {...commonProps}>
					<CartesianGrid {...gridProps} />
					<XAxis {...xAxisProps} />
					<YAxis {...yAxisProps} />
					<Tooltip {...tooltipProps} />
					{yKeys.length > 1 && <Legend />}
					{yKeys.map((key, i) => (
						<Bar
							key={key}
							dataKey={key}
							fill={COLORS[i % COLORS.length]}
							radius={[4, 4, 0, 0]}
							maxBarSize={40}
						/>
					))}
				</BarChart>
			);

		case "line":
			return (
				<LineChart {...commonProps}>
					<CartesianGrid {...gridProps} />
					<XAxis {...xAxisProps} />
					<YAxis {...yAxisProps} />
					<Tooltip {...tooltipProps} />
					{yKeys.length > 1 && <Legend />}
					{yKeys.map((key, i) => (
						<Line
							key={key}
							type="monotone"
							dataKey={key}
							stroke={COLORS[i % COLORS.length]}
							strokeWidth={2}
							dot={data.length < 50}
							activeDot={{ r: 4 }}
						/>
					))}
				</LineChart>
			);

		case "area":
			return (
				<AreaChart {...commonProps}>
					<CartesianGrid {...gridProps} />
					<XAxis {...xAxisProps} />
					<YAxis {...yAxisProps} />
					<Tooltip {...tooltipProps} />
					{yKeys.length > 1 && <Legend />}
					{yKeys.map((key, i) => (
						<Area
							key={key}
							type="monotone"
							dataKey={key}
							stroke={COLORS[i % COLORS.length]}
							fill={COLORS[i % COLORS.length]}
							fillOpacity={0.15}
							strokeWidth={2}
						/>
					))}
				</AreaChart>
			);
	}
}
