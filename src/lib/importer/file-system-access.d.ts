interface Window {
	showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}

interface FileSystemDirectoryHandle {
	[Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>;
	entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}
