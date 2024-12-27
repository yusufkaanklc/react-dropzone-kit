export const createDataTransfer = (files: File[]) => {
	if (!files) return;
	const newDataTransfer = new DataTransfer();

	for (const file of files) {
		newDataTransfer.items.add(file);
	}

	return newDataTransfer;
};

export const fileMimeSelector = (name: string) => {
	const types = {
		image: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"],
		video: [".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm"],
		document: [".pdf", ".doc", ".docx", ".txt", ".ppt", ".pptx", ".xls", ".xlsx"],
		audio: [".mp3", ".wav", ".ogg", ".flac", ".aac"],
		archive: [".zip", ".rar", ".tar", ".7z"],
	};

	for (const [key, extensions] of Object.entries(types)) {
		for (const extension of extensions) {
			if (name.toLowerCase().endsWith(extension)) {
				return `${key}/${extension.slice(1)}`;
			}
		}
	}

	return "unknown/unknown";
};

export const getFakePath = (fileName: string | string[]) => {
	if (!fileName) return;

	const pathName = (fileName: string) => `C:\\fakepath\\${fileName}`;

	// Her dosya için fake path oluştur
	return Array.isArray(fileName) ? fileName.map((fileName) => pathName(fileName)) : pathName(fileName);
};
