/**
 * Генерирует CSV строку из данных и триггерит скачивание файла
 */
export function exportToCsv(
	columns: string[],
	rows: Record<string, string>[],
	filename: string,
) {
	const escapeCsvValue = (val: string): string => {
		if (val.includes(",") || val.includes('"') || val.includes("\n")) {
			return `"${val.replace(/"/g, '""')}"`;
		}
		return val;
	};

	const header = columns.map(escapeCsvValue).join(",");
	const body = rows
		.map((row) => columns.map((col) => escapeCsvValue(row[col] ?? "")).join(","))
		.join("\n");

	const csvContent = `${header}\n${body}`;
	const blob = new Blob(["\uFEFF" + csvContent], {
		type: "text/csv;charset=utf-8;",
	});

	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${filename}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}
