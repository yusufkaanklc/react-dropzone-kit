import type { HTMLAttributes, ReactNode } from "react";

export type IDragDropEvents = "dragleave" | "dragenter" | "drop";

// Dosya yüklemeleriyle ilgili farklı hata türlerini tanımlar.
export type IFileErrorTypes = "file-invalid-type" | "file-too-large" | "file-too-small" | "too-many-files";

// Dosya reddedildiğinde döndürülen tip, dosya ve ilgili hata mesajlarını içerir.
export type IFileRejection = { file: File; error: IFileError[] };

// Dosya hatalarını tanımlayan tip, hata kodu ve hata mesajı içerir.
export type IFileError = { code: IFileErrorTypes; message: string };

// Dosya silem methodu prop tipleri
export interface IHandleFilesDeleteProps {
	deletedFiles: File[];
	allFiles?: File[];
	isAutoRemoveMode?: boolean;
}

// Dosya yükleme çocuk propları
export interface IChildProps {
	// Drag işlemi aktifse true olur.
	isDragActive?: boolean;

	// Dropzone'ın container (kapsayıcı) öğesinin HTML özellikleri.
	containerProps: HTMLAttributes<HTMLDivElement>;

	// Input öğesinin HTML özellikleri.
	inputProps: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

	// Silme işlemi için dosya silme fonksiyonu.
	handleFilesDelete: ({ deletedFiles, allFiles, isAutoRemoveMode }: IHandleFilesDeleteProps) => void;
}

// Dropzone bileşeninin props'larını tanımlar. Standart HTML input özelliklerini genişletir ancak "onDrop" ve "children" özelliklerini özelleştirmeyi sağlar.
export interface IDropzone extends Omit<HTMLAttributes<HTMLInputElement>, "children"> {
	initialFiles?: File[];

	// Dosyalar dropzone'a bırakıldığında tetiklenen isteğe bağlı callback fonksiyonu.
	onUpload?: (files: File[], fileRejections: IFileRejection[]) => void;

	// Kabul edilen dosyalar dropzone'a bırakıldığında tetiklenen isteğe bağlı callback fonksiyonu.
	onUploadAccepted?: (files: File[]) => void;

	// Reddedilen dosyalar dropzone'a bırakıldığında tetiklenen isteğe bağlı callback fonksiyonu.
	onUploadRejected?: (fileRejections: IFileRejection[]) => void;

	// Kabul edilen dosya formatlarının listesi (örneğin, ["image/png", "image/jpeg"]).
	acceptedFormats?: string[];

	// Dosya doğrulama hatalarının listesi.
	validationMessages?: IFileError[];

	// Dosyanın maksimum boyutu.
	maxSize?: number;

	// Dosyanın minimum boyutu.
	minSize?: number;

	// Birden fazla dosya kabul edilip edilmeyeceğini belirler.
	multiple?: boolean;

	// Maksimum dosya sayısı.
	maxFiles?: number;

	// Çocuk bileşeni, drag and drop işlemi için gerekli olan props ve dosya silme işlevini içerir.
	children: ({ containerProps, isDragActive, inputProps, handleFilesDelete }: IChildProps) => ReactNode;
}
