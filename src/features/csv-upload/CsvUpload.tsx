"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, FileUp, CheckCircle2 } from "lucide-react";
import { useCsvStore } from "@/entities/csv/useCsvStore";
import { cn } from "@/shared/lib/utils";

export function CsvUpload() {
	const importCsvFile = useCsvStore((s) => s.importCsvFile);
	const isLoading = useCsvStore((s) => s.isLoading);
	const importProgress = useCsvStore((s) => s.importProgress);
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = useCallback(
		(file: File) => {
			if (!file.name.toLowerCase().endsWith(".csv")) {
				alert("Пожалуйста, загрузите файл формата .csv");
				return;
			}
			importCsvFile(file);
		},
		[importCsvFile],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const file = e.dataTransfer.files[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) handleFile(file);
			if (inputRef.current) inputRef.current.value = "";
		},
		[handleFile],
	);

	const progressLabel = getProgressLabel(importProgress);
	const isComplete = importProgress >= 100;

	return (
		<div
			id="csv-upload-zone"
			role="button"
			tabIndex={0}
			onClick={() => !isLoading && inputRef.current?.click()}
			onKeyDown={(e) => {
				if ((e.key === "Enter" || e.key === " ") && !isLoading)
					inputRef.current?.click();
			}}
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			className={cn(
				"group relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-all duration-300 cursor-pointer min-h-[180px]",
				"border-border hover:border-primary/50 hover:bg-primary/5",
				isDragging && "border-primary bg-primary/10 scale-[1.02]",
				isLoading && "pointer-events-none",
			)}
		>
			<div
				className={cn(
					"flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300",
					"bg-muted group-hover:bg-primary/10",
					isDragging && "bg-primary/20 scale-110",
					isLoading && "bg-primary/10",
					isComplete && "bg-green-500/10",
				)}
			>
				{isComplete ? (
					<CheckCircle2 className="h-7 w-7 text-green-500" />
				) : isLoading ? (
					<FileUp className="h-7 w-7 text-primary animate-pulse" />
				) : (
					<Upload
						className={cn(
							"h-7 w-7 transition-colors",
							"text-muted-foreground group-hover:text-primary",
							isDragging && "text-primary",
						)}
					/>
				)}
			</div>

			<div className="text-center">
				<p className="text-sm font-medium text-foreground">
					{isLoading ? progressLabel : "Перетащите CSV файл сюда"}
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{isLoading
						? `${importProgress}%`
						: "или нажмите для выбора файла"}
				</p>
			</div>

			{/* Progress bar */}
			{(isLoading || isComplete) && (
				<div className="w-full max-w-[200px]">
					<div className="h-2 w-full rounded-full bg-muted overflow-hidden">
						<div
							className={cn(
								"h-full rounded-full transition-all duration-500 ease-out",
								isComplete ? "bg-green-500" : "bg-primary",
							)}
							style={{ width: `${importProgress}%` }}
						/>
					</div>
				</div>
			)}

			<input
				ref={inputRef}
				type="file"
				accept=".csv"
				onChange={handleChange}
				className="hidden"
				id="csv-file-input"
			/>
		</div>
	);
}

function getProgressLabel(progress: number): string {
	if (progress >= 100) return "Готово!";
	if (progress >= 75) return "Сохранение в IndexedDB...";
	if (progress >= 30) return "Парсинг CSV...";
	if (progress >= 10) return "Чтение файла...";
	return "Подготовка...";
}
