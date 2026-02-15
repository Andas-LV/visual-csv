export interface ParsedCsv {
	headers: string[];
	rows: Record<string, string>[];
}

/**
 * Парсит CSV-строку с поддержкой:
 * - quoted fields (кавычки внутри значений)
 * - запятые внутри кавычек
 * - разные line endings (CRLF, LF, CR)
 * - авто-определение разделителя (запятая, точка с запятой, табуляция)
 */
export function parseCsv(raw: string): ParsedCsv {
	const delimiter = detectDelimiter(raw);
	const lines = parseLines(raw, delimiter);

	if (lines.length === 0) {
		return { headers: [], rows: [] };
	}

	const headers = lines[0].map((h) => h.trim());
	const rows: Record<string, string>[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (line.length === 1 && line[0] === "") continue;

		const row: Record<string, string> = {};
		for (let j = 0; j < headers.length; j++) {
			row[headers[j]] = line[j]?.trim() ?? "";
		}
		rows.push(row);
	}

	return { headers, rows };
}

function detectDelimiter(raw: string): string {
	const firstLine = raw.split(/\r?\n/)[0] ?? "";
	const commas = (firstLine.match(/,/g) ?? []).length;
	const semicolons = (firstLine.match(/;/g) ?? []).length;
	const tabs = (firstLine.match(/\t/g) ?? []).length;

	if (tabs >= commas && tabs >= semicolons) return "\t";
	if (semicolons > commas) return ";";
	return ",";
}

function parseLines(raw: string, delimiter: string): string[][] {
	const result: string[][] = [];
	let current: string[] = [];
	let field = "";
	let inQuotes = false;
	let i = 0;

	while (i < raw.length) {
		const char = raw[i];

		if (inQuotes) {
			if (char === '"') {
				if (i + 1 < raw.length && raw[i + 1] === '"') {
					field += '"';
					i += 2;
				} else {
					inQuotes = false;
					i++;
				}
			} else {
				field += char;
				i++;
			}
		} else {
			if (char === '"') {
				inQuotes = true;
				i++;
			} else if (char === delimiter) {
				current.push(field);
				field = "";
				i++;
			} else if (char === "\r" || char === "\n") {
				current.push(field);
				field = "";
				result.push(current);
				current = [];

				if (char === "\r" && i + 1 < raw.length && raw[i + 1] === "\n") {
					i += 2;
				} else {
					i++;
				}
			} else {
				field += char;
				i++;
			}
		}
	}

	if (field !== "" || current.length > 0) {
		current.push(field);
		result.push(current);
	}

	return result;
}

export function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsText(file);
	});
}
