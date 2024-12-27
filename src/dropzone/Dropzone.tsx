import type { IDropzone, IFileError, IFileRejection, IHandleFilesDeleteProps } from "@/Interfaces";
import { createDataTransfer } from "@/utils/Helpers";
import { defaultValidationMessages, findValidFiles, formattedValidationMessages, validator } from "@/utils/Validator";
import { type HTMLAttributes, type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/**
 * Dropzone bileşeni, dosya yükleme için çoklu veya tekli dosya yükleme özelliği sunan bir React bileşenidir.
 * Kullanıcıların sürükle ve bırak veya dosya seçme yoluyla dosya yüklemelerini sağlar.
 *
 * @param {IDropzone} props - Dropzone bileşenine iletilen özellikler.
 * @param {(files: File[], rejections: IFileRejection[]) => void} props.onUpload - Geçerli ve geçersiz dosyaların döndürüldüğü callback.
 * @param {(rejections: IFileRejection[]) => void} [props.onUploadRejected] - Geçersiz dosyalar için çalışan callback.
 * @param {(files: File[]) => void} [props.onUploadAccepted] - Geçerli dosyalar için çalışan callback.
 * @param {boolean} [props.multiple=true] - Çoklu dosya yükleme seçeneği.
 * @param {File[]} [props.initialFiles] - İlk yüklenmiş dosyalar.
 * @param {string[]} [props.acceptedFormats] - Kabul edilen dosya formatları.
 * @param {number} [props.maxFiles] - Maksimum yüklenebilecek dosya sayısı.
 * @param {number} [props.maxSize] - Dosya boyutu üst sınırı (byte cinsinden).
 * @param {number} [props.minSize] - Dosya boyutu alt sınırı (byte cinsinden).
 * @param {IFileError[]} [props.validationMessages] - Doğrulama mesajları.
 * @param {React.MouseEventHandler<HTMLInputElement>} [props.onClick] - Input elementine tıklanıldığında çalışan callback.
 * @param {Function} props.children - Render fonksiyonu.
 * @returns {JSX.Element | null} Dropzone bileşeni.
 */
export const Dropzone = ({
	onUpload,
	onUploadRejected,
	onUploadAccepted,
	multiple = true,
	initialFiles,
	acceptedFormats,
	maxFiles,
	maxSize,
	minSize,
	onChange,
	onDrop,
	validationMessages,
	onClick,
	children,
	...props
}: IDropzone) => {
	const [internalValidationMessages, setInternalValidationMessages] = useState<IFileError[] | undefined>([]);
	const [isDragActive, setIsDragActive] = useState<boolean>(false);
	const [preventDropTrigger, setPreventDropTrigger] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);

	// Varsayılan doğrulama mesajları
	const memoizedDefaultValidationMessages = useMemo(
		(): IFileError[] => defaultValidationMessages({ acceptedFormats, maxFiles }),
		[acceptedFormats, maxFiles],
	);

	/**
	 * Dosya yükleme işlemi sırasında tetiklenen olayları işler.
	 *
	 * @param {File[]} validFiles - Geçerli dosyaların listesi.
	 * @param {IFileRejection[]} rejections - Reddedilen dosyaların listesi.
	 */
	const triggerEvents = useCallback(
		(validFiles: File[], rejections: IFileRejection[]) => {
			if (files.length === validFiles.length + rejections.length) return;
			// Geçerli dosyalar için yükleme işlemini tetikler
			onUpload?.(validFiles, rejections);

			// Reddedilen dosyalar için yükleme işlemini tetikler
			onUploadRejected?.(rejections);
			// Kabul edilen dosyalar için yükleme işlemini tetikler
			onUploadAccepted?.(validFiles);
		},
		[onUpload, onUploadRejected, onUploadAccepted, files],
	);

	/**
	 * Dosya doğrulama işlemi yapar ve reddedilen dosyaları döner.
	 *
	 * @param {File[]} files - Doğrulama yapılacak dosyaların listesi.
	 * @returns {IFileRejection[]} - Reddedilen dosyaların listesi.
	 */
	const createRejections = useMemo(
		() => (files: File[]) => {
			return validator({
				files,
				maxFiles,
				maxSize,
				minSize,
				messages: internalValidationMessages,
				acceptedFormats,
			});
		},
		[maxFiles, maxSize, minSize, internalValidationMessages, acceptedFormats],
	);

	const memoizedFormattedValidationMessages = useMemo(
		() => (prevMessages: IFileError[], newMessages?: IFileError[]) => formattedValidationMessages(prevMessages, newMessages),
		[],
	);

	// Dosya formatlar ve inputa yükler
	const setInputFiles = useCallback((files: File[]) => {
		if (!inputRef.current || !files) return;

		const dataTransfer = new DataTransfer();
		for (const file of files) {
			dataTransfer.items.add(file);
		}

		inputRef.current.files = dataTransfer.files;
	}, []);

	/**
	 * Bir dosyayı listeden siler.
	 *
	 * @param {File[]} deletedFiles - Silinecek dosyaların listesi.
	 * @param {File[]} allFiles - Mevcut dosyaların listesi (varsayılan olarak `files` kullanılır).
	 * @param {boolean} isAutoRemoveMode - Otomatik kaldırma modu aktif mi? (Varsayılan: false)
	 */
	const handleFilesDelete = useCallback(
		({ deletedFiles, allFiles = files, isAutoRemoveMode = false }: IHandleFilesDeleteProps) => {
			// Eğer inputRef veya silinecek dosyalar geçerli değilse, fonksiyonu sonlandır.
			if (!inputRef.current || !deletedFiles || deletedFiles.length === 0) return;

			/**
			 * Silinmeyen dosyaların listesini döndüren yardımcı fonksiyon.
			 *
			 * @param {File[]} allFiles - Mevcut dosyalar.
			 * @param {File[]} deletedFiles - Silinecek dosyalar.
			 * @returns {File[]} - Silinmeyen dosyaların listesi.
			 */
			const getRemainingFiles = (allFiles: File[], deletedFiles: File[]) => {
				// Silinmek istenen dosyaların isimlerini bir Set içinde tutarak, filtreleme yapıyoruz.
				const deletedFilesNames = new Set(deletedFiles.map((file) => file.name));
				return allFiles.filter((file) => !deletedFilesNames.has(file.name));
			};

			/**
			 * Input'ta değişiklik olduğunu belirten bir olay tetikler.
			 * (Bu işlem, input elemanındaki dosya listesini güncelledikten sonra yapılır.)
			 */
			const triggerChangeEvent = () => {
				setTimeout(() => {
					inputRef.current?.dispatchEvent(new Event("change", { bubbles: true }));
				}, 0);
			};

			// Silinmeyen dosyaları ve reddedilen dosyaların listesini alıyoruz
			const remainingFiles = getRemainingFiles(allFiles, deletedFiles);

			// Yeni oluşturulacak reddedilen dosyalar
			const remainingRejections = createRejections(remainingFiles);

			// Reddedilen dosyaların olmadığından emin olmak için dosyaları filtreliyoruz
			const filteredRemainingFiles = findValidFiles(remainingFiles, remainingRejections);

			// Input dosyalarını güncelliyoruz
			setInputFiles(filteredRemainingFiles);

			// Eğer otomatik kaldırma modu aktifse, sadece dosya listesini güncelliyoruz
			if (isAutoRemoveMode) return;

			// State'leri güncelliyoruz
			setFiles(remainingFiles);

			// İlgili etkinlikleri tetikliyoruz (dosyalar ve reddedilenler için)
			triggerEvents(filteredRemainingFiles, remainingRejections);
			// Drop işlemini engelleyen trigger'ı aktifleştiriyoruz
			setPreventDropTrigger(true);

			// Input değişiklik olayını tetikliyoruz
			triggerChangeEvent();
		},
		[files, createRejections, triggerEvents, setInputFiles],
	);

	/**
	 * Dosya bırakma veya dosya seçme işlemini yönetir.
	 *
	 * Bu fonksiyon, kullanıcı dosya bırakma veya dosya seçme işlemi gerçekleştirdiğinde tetiklenir.
	 * Dosyaların geçerli olup olmadığı kontrol edilir ve geçerli dosyalar işleme alınır.
	 * Geçersiz dosyalar reddedilir ve gerekli işlemler yapılır.
	 *
	 * @param {React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>} event - Olay nesnesi.
	 */
	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement>) => {
			// Drop işlemi engellendiyse, tekrar aktif hale getir
			if (preventDropTrigger) {
				setPreventDropTrigger(false); // Drop tekrar kullanılabilir hale gelsin
				return;
			}

			event.preventDefault();

			// Yeni dosyaları al
			const newFiles = "dataTransfer" in event ? Array.from(event.dataTransfer.files) : Array.from(event.target.files || []);

			// Dosya yoksa işlem yapma
			if (newFiles?.length === 0) return;

			const rejections = createRejections(newFiles);

			// Geçerli dosyaları bul ve reddedilen dosyaları al
			const validFiles = findValidFiles(newFiles, rejections);

			// Dosya listesini güncelle
			setFiles(newFiles);

			// Eğer reddedilen dosyalar varsa, bu dosyaları sil
			if (rejections.length > 0) {
				const rejectedFiles = rejections.map((rejection) => rejection.file);
				handleFilesDelete({ deletedFiles: rejectedFiles, allFiles: newFiles, isAutoRemoveMode: true });
			}

			// Drag&Drop işlemi ise, input dosyalarını ayarla ve onDrop olayını tetikle
			if ("dataTransfer" in event) {
				// input dosyalarını ayarla
				setInputFiles(validFiles);

				// event'i React.DragEvent olarak cast ediyoruz
				const dragEvent = event as React.DragEvent<HTMLInputElement>;

				// createDataTransfer ile validFiles'ı kullanarak yeni bir DataTransfer objesi oluşturuyoruz
				const modifiedEvent = {
					...dragEvent,
					dataTransfer: createDataTransfer(validFiles) as DataTransfer, // createDataTransfer'dan dönen değer doğru türde olmalı
				};

				// onDrop olayını tetikliyoruz
				onDrop?.(modifiedEvent);
			}

			if ("target" in event) {
				const changeEvent = event as React.ChangeEvent<HTMLInputElement>;

				// HTMLInputElement türünde target'ı güncelliyoruz
				const modifiedTarget = {
					...changeEvent.target,
					files: validFiles, // validFiles'ı doğru türde atıyoruz
				};

				// onChange fonksiyonunu tetikliyoruz
				onChange?.({ ...changeEvent, target: modifiedTarget });
			}

			// Olayları tetikle
			triggerEvents(validFiles, rejections);
		},
		[preventDropTrigger, createRejections, handleFilesDelete, triggerEvents, onDrop, onChange, setInputFiles],
	);

	/**
	 * Drag over olayını yönetir.
	 * @param {React.DragEvent<HTMLDivElement>} event - Olay nesnesi.
	 */
	const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	}, []);

	/**
	 * Drag işlemi başladığında veya bittiğinde tetiklenir.
	 * @param {React.DragEvent<HTMLInputElement>} _e - Olay nesnesi.
	 * @param {"enter" | "leave"} type - Drag durumu.
	 */
	const handleDrag = useCallback((type: "enter" | "leave") => {
		setIsDragActive(type === "enter");
	}, []);

	// Tıklama olayından sonra dosya seçilmez dosyalar sıfırlanır
	const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
		setTimeout(() => {
			setFiles([]);
			triggerEvents([], []);
		}, 100);
		onClick?.(e);
	};

	// Container özellikleri
	const containerProps: HTMLAttributes<HTMLDivElement> = {
		className: "dropzone-container",
		style: { position: "relative" },
		onDragOver: handleDragOver,

		onDragEnter: () => handleDrag("enter"),
		onDragLeave: () => handleDrag("leave"),
	};

	// Input özellikleri
	const inputProps: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
		ref: RefObject<HTMLInputElement | null>;
	} = {
		className: "dropzone-input",
		style: {
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			width: "100%",
			height: "100%",
			opacity: 0,
			cursor: "pointer",
		},
		tabIndex: -1,
		ref: inputRef,
		accept: acceptedFormats ? acceptedFormats.join(", ") : undefined,
		type: "file",
		role: "textbox",
		multiple,
		onDrop: handleDrop,
		onChange: handleDrop,
		onClick: handleClick,
		...props,
	};

	// Initial files setup
	useLayoutEffect(() => {
		setTimeout(() => {
			if (!initialFiles || initialFiles.length === 0 || !inputRef.current) return;
			setInputFiles(initialFiles);
			inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
		}, 10);
	}, [initialFiles, setInputFiles]);

	// Validation messages'lerin ayarlanması
	useEffect(() => {
		setInternalValidationMessages(memoizedFormattedValidationMessages(memoizedDefaultValidationMessages, validationMessages));
	}, [validationMessages, memoizedDefaultValidationMessages, memoizedFormattedValidationMessages]);

	// Hata mesajları güncellendiğinde dosyalara uygular
	useEffect(() => {
		if (!internalValidationMessages) return;
		const updatedRejections = createRejections(files);
		const filteredRemainingFiles = findValidFiles(files, updatedRejections);
		triggerEvents(filteredRemainingFiles, updatedRejections);
	}, [createRejections, files, internalValidationMessages, triggerEvents]);

	// Eğer children bir fonksiyon değilse render etmiyoruz
	if (typeof children !== "function" || internalValidationMessages?.length === 0) return null;

	return <div data-testid="dropzone">{children({ containerProps, inputProps, handleFilesDelete, isDragActive })}</div>;
};
