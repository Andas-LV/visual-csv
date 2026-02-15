const DB_NAME = "visual-csv-db";
const DB_VERSION = 1;
const DATASETS_STORE = "datasets";
const DATA_STORE = "data";

export interface CsvDataset {
	id: string;
	name: string;
	createdAt: number;
	rowCount: number;
	columns: string[];
}

export interface CsvDataChunk {
	datasetId: string;
	rows: Record<string, string>[];
}

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;

			if (!db.objectStoreNames.contains(DATASETS_STORE)) {
				db.createObjectStore(DATASETS_STORE, { keyPath: "id" });
			}

			if (!db.objectStoreNames.contains(DATA_STORE)) {
				db.createObjectStore(DATA_STORE, { keyPath: "datasetId" });
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function saveDataset(
	dataset: CsvDataset,
	rows: Record<string, string>[],
): Promise<void> {
	const db = await openDb();

	return new Promise((resolve, reject) => {
		const tx = db.transaction([DATASETS_STORE, DATA_STORE], "readwrite");
		tx.objectStore(DATASETS_STORE).put(dataset);
		tx.objectStore(DATA_STORE).put({
			datasetId: dataset.id,
			rows,
		} satisfies CsvDataChunk);

		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export async function getAllDatasets(): Promise<CsvDataset[]> {
	const db = await openDb();

	return new Promise((resolve, reject) => {
		const tx = db.transaction(DATASETS_STORE, "readonly");
		const request = tx.objectStore(DATASETS_STORE).getAll();

		request.onsuccess = () => resolve(request.result as CsvDataset[]);
		request.onerror = () => reject(request.error);
	});
}

export async function getDatasetRows(
	datasetId: string,
): Promise<Record<string, string>[]> {
	const db = await openDb();

	return new Promise((resolve, reject) => {
		const tx = db.transaction(DATA_STORE, "readonly");
		const request = tx.objectStore(DATA_STORE).get(datasetId);

		request.onsuccess = () => {
			const result = request.result as CsvDataChunk | undefined;
			resolve(result?.rows ?? []);
		};
		request.onerror = () => reject(request.error);
	});
}

export async function deleteDataset(datasetId: string): Promise<void> {
	const db = await openDb();

	return new Promise((resolve, reject) => {
		const tx = db.transaction([DATASETS_STORE, DATA_STORE], "readwrite");
		tx.objectStore(DATASETS_STORE).delete(datasetId);
		tx.objectStore(DATA_STORE).delete(datasetId);

		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
