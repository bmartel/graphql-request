export type FileType = File | Blob | FileList;
interface FileData {
	[file: string]: FileType | FileData;
}
export type FilesRequest<T> = T & FileData;
export type FilesResult<T> = {
	[P in keyof T]: T[P] | null;
} | Array<unknown> | {} | null;
export type ExtractableFiles = Map<FileType, Array<string>>;
export type ExtractFilesResult<T> = { clone: FilesResult<T>; files: ExtractableFiles };

// https://github.com/jaydenseric/extract-files/blob/master/src/extractFiles.mjs
export function extractFiles<T>(value: FilesRequest<T>, path: string = ''): ExtractFilesResult<T> | null {
	let clone: FilesResult<T>;
	const files = new Map() as ExtractableFiles;

  /**
   * Adds a file to the extracted files map.
   */
	function addFile(paths: Array<string>, file: FileType) {
		const storedPaths = files.get(file)
		if (storedPaths) storedPaths.push(...paths)
		else files.set(file, paths)
	}

	if (
		(typeof File !== 'undefined' && value instanceof File) ||
		(typeof Blob !== 'undefined' && value instanceof Blob)
	) {
		clone = null
		addFile([path], value)
	} else {
		const prefix = path ? `${path}.` : ''

		if (typeof FileList !== 'undefined' && value instanceof FileList) {
			clone = Array.prototype.map.call(value, (file, i) => {
				addFile([`${prefix}${i}`], file)
				return null
			})
		} else if (Array.isArray(value)) {
			clone = value.map((child, i) => {
				const result = extractFiles(child, `${prefix}${i}`)
				result!.files.forEach(addFile)
				return result!.clone
			})
		} else if (value && value.constructor === Object) {
			clone = {} as any;
			for (const i in value) {
				const result = extractFiles(value[i] as FilesRequest<T>, `${prefix}${i}`);
				result!.files.forEach(addFile);
				(clone as any)[i] = result!.clone;
			}
		} else clone = value
	}

	return { clone, files }
}
