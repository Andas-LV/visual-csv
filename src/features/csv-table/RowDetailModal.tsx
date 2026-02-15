"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ModalLayout } from "@/shared/layouts/ModalLayout";

interface RowDetailModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	row: Record<string, string> | null;
	rowIndex: number | null;
	columns: string[];
}

export function RowDetailModal({
	open,
	onOpenChange,
	row,
	rowIndex,
	columns,
}: RowDetailModalProps) {
	const [copiedField, setCopiedField] = useState<string | null>(null);

	if (!row) return null;

	const handleCopy = (col: string, value: string) => {
		const textarea = document.createElement("textarea");
		textarea.value = value;
		textarea.style.position = "fixed";
		textarea.style.opacity = "0";
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand("copy");
		document.body.removeChild(textarea);

		setCopiedField(col);
		setTimeout(() => setCopiedField(null), 1500);
	};

	const titleContent = (
		<div className="flex items-center gap-3">
			<span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-sm font-bold">
				{rowIndex !== null ? rowIndex + 1 : "#"}
			</span>
			<span className="text-base font-semibold">
				Запись #{rowIndex !== null ? rowIndex + 1 : ""}
			</span>
			<span className="ml-auto text-xs text-muted-foreground font-normal hidden sm:inline">
				Нажмите на значение для копирования
			</span>
		</div>
	);

	const footerContent = (
		<p className="text-xs text-muted-foreground text-center w-full">
			{columns.length} полей •{" "}
			{columns.filter((c) => (row[c] ?? "").trim() !== "").length} заполнено
		</p>
	);

	return (
		<ModalLayout
			open={open}
			onOpenChange={onOpenChange}
			title={titleContent}
			footer={footerContent}
			className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-0 p-2"
		>
			<div className="overflow-auto flex-1 px-4 sm:px-8 py-4 sm:py-6">
				<div className="grid gap-2">
					{columns.map((col, idx) => {
						const value = row[col] ?? "";
						const isEmpty = value.trim() === "";
						const isCopied = copiedField === col;

						return (
							<div
								key={col}
								className={cn(
									"group rounded-lg border border-border p-3 sm:p-5 transition-all duration-200",
									"hover:bg-accent/30 hover:border-primary/20",
									idx % 2 === 0 ? "bg-transparent" : "bg-muted/20",
								)}
							>
								<div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
									<div className="shrink-0 sm:min-w-[140px] sm:max-w-[200px] sm:pt-0.5">
										<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
											{col}
										</p>
									</div>
									<button
										type="button"
										onClick={() => !isEmpty && handleCopy(col, value)}
										className={cn(
											"flex-1 min-w-0 text-left transition-opacity",
											!isEmpty && "cursor-copy hover:opacity-80",
										)}
										disabled={isEmpty}
									>
										{isEmpty ? (
											<p className="text-sm italic text-muted-foreground/50">
												—
											</p>
										) : isLongValue(value) ? (
											<p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
												{value}
											</p>
										) : isNumericValue(value) ? (
											<p className="text-sm font-mono text-foreground tabular-nums">
												{value}
											</p>
										) : (
											<p className="text-sm text-foreground break-words">
												{value}
											</p>
										)}
									</button>
									{!isEmpty && (
										<div className="shrink-0 pt-0.5 hidden sm:block">
											{isCopied ? (
												<Check className="h-3.5 w-3.5 text-green-500" />
											) : (
												<Copy className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
											)}
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</ModalLayout>
	);
}

function isLongValue(value: string): boolean {
	return value.length > 80;
}

function isNumericValue(value: string): boolean {
	return /^-?\d[\d\s.,]*$/.test(value.trim());
}
