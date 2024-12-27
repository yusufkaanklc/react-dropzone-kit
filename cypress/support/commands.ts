/// <reference types="cypress" />

import { DragDropEvents } from "@/Enums";
import type { IDragDropEvents } from "@/Interfaces";
import { fileMimeSelector } from "@/utils/Helpers";

declare global {
	namespace Cypress {
		interface Chainable {
			/**
			 * `data-testid` özelliğine sahip bir öğeyi seçer.
			 * @param value `data-testid` attribute değeri
			 * @example cy.getByTestId('submit-button')
			 */
			getByTestId(value: string): Chainable<JQuery<HTMLElement>>;

			/**
			 * Hedef öğeye bir drag-and-drop (sürükle ve bırak) olayı tetikler.
			 * @param files - Sürüklenip bırakılacak dosyalar
			 * @param event - Tetiklenecek drag-and-drop olay türü
			 * @example cy.getByTestId('drop-area').dragDropTrigger([file1, file2], 'drop')
			 */
			dragDropTrigger(files: File[], event: IDragDropEvents): Chainable<JQuery<HTMLElement>>;

			/**
			 * Hedef dosyayı yükleme simulasyonu uygular
			 * @param fileName - Yüklenecek olan dosyanın ismi
			 * Yüklenecek olan dosya fixtures klasorunde olmalı
			 */
			loadFixture(fileName: string): Chainable<{ fileContent: File; mimeType: string; fileName: string }>;
		}
	}
}

Cypress.Commands.add("getByTestId", (value) => {
	// `data-testid` özelliğine sahip öğeleri seçer
	return cy.get(`[data-testid="${value}"]`);
});

Cypress.Commands.add("dragDropTrigger", { prevSubject: "element" }, (subject, files, event) => {
	// Dosyaların ve olay türünün geçerli olduğundan emin olun
	if (!files.length) {
		throw new Error("No files provided for drag and drop");
	}
	if (!DragDropEvents.includes(event)) {
		throw new Error(`Invalid drag-drop event: ${event}`);
	}

	// Verilen dosyalar ve olay türü ile drag-and-drop olayını tetikler
	cy.wrap(subject).trigger(event, {
		dataTransfer: {
			files,
		},
	});
});

Cypress.Commands.add("loadFixture", (fileName) => {
	return cy.fixture(fileName, "binary").then((content) => {
		// Dosyanın MIME türünü belirler
		const mimeType = fileMimeSelector(fileName);

		// File nesnesi oluşturuluyor
		const file = new File([content], fileName, { type: mimeType });

		// Dosya içeriğini ve diğer bilgileri döndür
		return {
			fileContent: file,
			mimeType: mimeType,
			fileName: fileName,
		};
	});
});
