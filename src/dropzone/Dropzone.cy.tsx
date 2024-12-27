import { DropzoneErrorCode } from "@/Enums";
import type { IChildProps, IDropzone, IFileError } from "@/Interfaces";
import { getFakePath } from "@/utils/Helpers";
import { defaultValidationMessages, formattedValidationMessages, validator } from "@/utils/Validator";
import "cypress-file-upload";
import { mount } from "cypress/react18";
import { Dropzone } from "./Dropzone";

// Setup fonksiyonu, Dropzone bileşenini mount eder ve çocuk bileşen için bir mock oluşturur
const setup = (props: Omit<IDropzone, "children">) => {
	const childrenMock = cy
		.stub()
		.as("children")
		.callsFake(({ containerProps, inputProps, isDragActive }: IChildProps) => (
			<div {...containerProps} style={{ background: "red", width: "100%", height: "10rem" }} data-testid="dropzone-container">
				<input {...inputProps} data-testid="dropzone-input" />
				<p data-testid="dropzone-drag-status">{isDragActive ? "Drag Active" : "Drag Inactive"}</p>
			</div>
		));

	mount(<Dropzone {...props}>{childrenMock}</Dropzone>);

	return { childrenMock };
};

describe("Dropzone component", () => {
	let onUploadMock: sinon.SinonStub;
	let onAcceptMock: sinon.SinonStub;
	let onRejectMock: sinon.SinonStub;

	let fixtures: Record<string, { fileContent: File; fileName: string; mimeType: string }>;

	const fileNames = ["file-large.png", "file-valid.png", "file-invalid.txt"];

	// Testlerden önce dosyaları yükle
	before(() => {
		fixtures = {};
		fileNames.map((fileName) => {
			cy.loadFixture(fileName).then((fileData) => {
				fixtures[fileData.fileName] = fileData;
			});
		});
	});

	// Her testten önce mock fonksiyonlarını sıfırla
	beforeEach(() => {
		onUploadMock = cy.stub().as("upload");
		onAcceptMock = cy.stub().as("accept");
		onRejectMock = cy.stub().as("reject");
	});

	// Her testten sonra mock fonksiyonlarını sıfırla
	afterEach(() => {
		onUploadMock.resetHistory();
		onAcceptMock.resetHistory();
		onRejectMock.resetHistory();
	});

	// Dropzone bileşeninin render edilip çocuk fonksiyonunun çağrıldığını test et
	it("Renders without crashing and calls children as a function", () => {
		const { childrenMock } = setup({ className: "test" });
		const container = cy.getByTestId("dropzone-container");

		container.should("be.visible");
		cy.wrap(childrenMock).should("have.been.calledOnce");
	});

	// Dosya seçimi ve input ile doğru şekilde yükleme yapılması testi
	it("Handles file selection via input", () => {
		setup({
			onUpload: onUploadMock,
			onUploadAccepted: onAcceptMock,
			onUploadRejected: onRejectMock,
		});

		const input = cy.getByTestId("dropzone-input");

		const { fileContent, fileName, mimeType } = fixtures["file-valid.png"];

		input.attachFile({ fileContent, fileName, mimeType });

		input.should("have.value", getFakePath(fileName));

		cy.wrap(onUploadMock).should("be.calledOnceWith", [fileContent], []); // Yükleme fonksiyonunun doğru argümanla çağrıldığını kontrol et
		cy.wrap(onAcceptMock).should("be.calledOnceWith", [fileContent]); // Kabul edilen dosya fonksiyonunun çağrıldığını kontrol et
		cy.wrap(onRejectMock).should("be.calledOnceWith", []); // Red edilen dosya fonksiyonunun çağrılmadığını kontrol et
	});

	// Kabul edilen ve reddedilen dosyaların doğru şekilde işlenmesi testi
	it("Handles rejected and accepted files correctly via input", () => {
		setup({
			maxSize: 1024 * 1024 * 2, // 2 MB
			onUpload: onUploadMock,
			onUploadAccepted: onAcceptMock,
			onUploadRejected: onRejectMock,
		});

		const input = cy.getByTestId("dropzone-input");

		const { fileContent: fileValidContent, fileName: fileValidName, mimeType: fileValidMime } = fixtures["file-valid.png"];
		const { fileContent: fileLargeContent, fileName: fileLargeName, mimeType: fileLargeMime } = fixtures["file-large.png"];

		input
			.attachFile([
				{ fileContent: fileValidContent, fileName: fileValidName, mimeType: fileValidMime },
				{ fileContent: fileLargeContent, fileName: fileLargeName, mimeType: fileLargeMime },
			])
			.then(() => {
				input.invoke("val").should("eq", getFakePath(fileValidName)); // Doğru dosyanın seçildiğini kontrol et

				const errorMessages = validator({
					files: [fileLargeContent],
					maxSize: 1024 * 1024,
					messages: defaultValidationMessages({}),
				});

				cy.wrap(onUploadMock).should("be.calledOnceWith", [fileValidContent], errorMessages); // Yükleme fonksiyonunun doğru şekilde çağrıldığını kontrol et
				cy.wrap(onAcceptMock).should("be.calledOnceWith", [fileValidContent]); // Kabul edilen dosyanın doğru şekilde kabul edildiğini kontrol et
				cy.wrap(onRejectMock).should("be.calledOnceWith", errorMessages); // Hatalı dosyanın reddedildiğini kontrol et
			});
	});

	// Drag and drop işleminin doğru şekilde işlenmesi testi
	it("Handles drag and drop correctly with a file", () => {
		setup({ className: "test", onUpload: onUploadMock, onUploadAccepted: onAcceptMock, onUploadRejected: onRejectMock });

		const input = cy.getByTestId("dropzone-input");
		const dragStatus = cy.getByTestId("dropzone-drag-status");

		dragStatus.should("have.text", "Drag Inactive");

		const { fileContent, fileName } = fixtures["file-valid.png"];

		input.dragDropTrigger([fileContent], "dragenter"); // Drag etkinleştirilmesi
		cy.wait(100);

		dragStatus.should("have.text", "Drag Active");

		input.dragDropTrigger([fileContent], "dragleave"); // Drag iptal edilmesi
		cy.wait(100);

		dragStatus.should("have.text", "Drag Inactive");

		input.dragDropTrigger([fileContent], "drop"); // Dosya bırakılması
		cy.wait(100);

		input.invoke("val").should("eq", getFakePath(fileName));

		cy.wrap(onUploadMock).should("be.calledOnceWith", [fileContent], []); // Yükleme fonksiyonunun doğru çağrıldığını kontrol et
		cy.wrap(onAcceptMock).should("be.calledOnceWith", [fileContent]); // Kabul edilen dosyanın doğru şekilde kabul edildiğini kontrol et
		cy.wrap(onRejectMock).should("be.calledOnceWith", []); // Red edilen dosyanın çağrılmadığını kontrol et
	});

	// Geçersiz dosya tipi hatası testi input ile
	it("Handles invalid file type error via input", () => {
		const acceptedFormats = ["image/png", "image/png"];
		setup({
			acceptedFormats,
			onUpload: onUploadMock,
			onUploadAccepted: onAcceptMock,
			onUploadRejected: onRejectMock,
		});

		const input = cy.getByTestId("dropzone-input");

		const { fileContent, mimeType, fileName } = fixtures["file-invalid.txt"];

		input.attachFile({ fileContent, mimeType, fileName });

		input.invoke("val").should("eq", "");

		const errorMessages = validator({
			files: [fileContent],
			acceptedFormats,
			messages: defaultValidationMessages({ acceptedFormats }),
		});

		cy.wrap(onRejectMock).should("be.calledOnceWith", errorMessages); // Geçersiz dosya tipinin reddedildiğini kontrol et
	});

	// Geçersiz dosya tipi hatası testi drag&drop ile
	it("Handles invalid file type error via drag&drop", () => {
		const acceptedFormats = ["image/png", "image/png"];
		setup({
			acceptedFormats,
			onUpload: onUploadMock,
			onUploadAccepted: onAcceptMock,
			onUploadRejected: onRejectMock,
		});

		const input = cy.getByTestId("dropzone-input");

		const { fileContent } = fixtures["file-invalid.txt"];

		input.dragDropTrigger([fileContent], "drop");

		cy.wait(100);

		input.invoke("val").should("eq", "");

		const errorMessages = validator({
			files: [fileContent],
			acceptedFormats,
			messages: defaultValidationMessages({ acceptedFormats }),
		});

		cy.wrap(onRejectMock).should("be.calledOnceWith", errorMessages); // Geçersiz dosya tipinin reddedildiğini kontrol et
	});

	// Dosya boyutu çok büyük olduğunda hata testi input ile
	it("Handles file too large error via input", () => {
		setup({
			maxSize: 1024 * 1024 * 2, // 2MB
			onUpload: onUploadMock,
			onUploadAccepted: onAcceptMock,
			onUploadRejected: onRejectMock,
		});

		const input = cy.getByTestId("dropzone-input");

		const { fileContent, mimeType, fileName } = fixtures["file-large.png"];

		input.attachFile({ fileContent, mimeType, fileName });

		input.invoke("val").should("eq", "");

		const errorMessages = validator({
			files: [fileContent],
			maxSize: 1024, // Dosya boyut sınırı (1 KB)
			messages: defaultValidationMessages({}),
		});

		cy.wrap(onRejectMock).should("be.calledOnceWith", errorMessages); // Dosya boyutu çok büyükse hata verildiğini kontrol et
	});

	// Dosya boyutu çok büyük olduğunda hata testi drag&drop ile
	it("Handles file too large error via drag&drop", () => {
		setup({
			maxSize: 1024 * 1024 * 2, // 2MB
			onUpload: onUploadMock,
			onUploadAccepted: onAcceptMock,
			onUploadRejected: onRejectMock,
		});

		const input = cy.getByTestId("dropzone-input");

		const { fileContent } = fixtures["file-large.png"];

		input.dragDropTrigger([fileContent], "drop");

		cy.wait(100);

		input.invoke("val").should("eq", "");

		const errorMessages = validator({
			files: [fileContent],
			maxSize: 1024, // Dosya boyut sınırı (1 KB)
			messages: defaultValidationMessages({}),
		});

		cy.wrap(onRejectMock).should("be.calledOnceWith", errorMessages); // Dosya boyutu çok büyükse hata verildiğini kontrol et
	});

	// Dosya boyutu çok küçük olduğunda hata testi input ile
	it("Handles file too small error via input", () => {
		setup({
			minSize: 1024 * 1024 * 5, // 5 MB minimum boyut
			onUpload: onUploadMock,
			onUploadAccepted: onAcceptMock,
			onUploadRejected: onRejectMock,
		});

		const input = cy.getByTestId("dropzone-input");

		const { fileContent, mimeType, fileName } = fixtures["file-valid.png"];

		input.attachFile({ fileContent, mimeType, fileName });

		input.invoke("val").should("eq", "");

		const errorMessages = validator({
			files: [fileContent],
			minSize: 1024 * 1024,
			messages: defaultValidationMessages({}),
		});
		cy.wrap(onRejectMock).should("be.calledOnceWith", errorMessages); // Dosya boyutu çok küçükse hata verildiğini kontrol et
	});

	// Dosya boyutu çok küçük olduğunda hata testi drag&drop ile
	it("Handles file too small error via drag&drop ile", () => {
		setup({
			minSize: 1024 * 1024 * 5, // 5 MB minimum boyut
			onUpload: onUploadMock,
			onUploadAccepted: onAcceptMock,
			onUploadRejected: onRejectMock,
		});

		const input = cy.getByTestId("dropzone-input");

		const { fileContent } = fixtures["file-valid.png"];

		input.dragDropTrigger([fileContent], "drop");

		cy.wait(100);

		input.invoke("val").should("eq", "");

		const errorMessages = validator({
			files: [fileContent],
			minSize: 1024 * 1024,
			messages: defaultValidationMessages({}),
		});
		cy.wrap(onRejectMock).should("be.calledOnceWith", errorMessages); // Dosya boyutu çok küçükse hata verildiğini kontrol et
	});

	// Farklı türdeki dosyaların yüklenmesi ve doğrulama testi
	it("Handles multiple files of different types and validates correctly via input", () => {
		const maxFiles = 2;
		const maxSize = 1024 * 1024;
		setup({
			maxFiles,
			maxSize,
			onUpload: onUploadMock,
			onUploadAccepted: onAcceptMock,
			onUploadRejected: onRejectMock,
		});

		const input = cy.getByTestId("dropzone-input");

		const { fileContent: fileLargeContent, mimeType: fileLargeMimeType, fileName: fileLargeName } = fixtures["file-large.png"];
		const {
			fileContent: fileInvalidContent,
			mimeType: fileInvalidMimeType,
			fileName: fileInvalidName,
		} = fixtures["file-invalid.txt"];
		const { fileContent: fileValidContent, mimeType: fileValidMimeType, fileName: fileValidName } = fixtures["file-valid.png"];

		input.attachFile([
			{ fileContent: fileLargeContent, fileName: fileLargeName, mimeType: fileLargeMimeType },
			{ fileContent: fileInvalidContent, fileName: fileInvalidName, mimeType: fileInvalidMimeType },
			{ fileContent: fileValidContent, fileName: fileValidName, mimeType: fileValidMimeType },
		]);

		const errorMessages = validator({
			files: [fileLargeContent, fileInvalidContent, fileValidContent],
			maxSize,
			maxFiles,
			messages: defaultValidationMessages({ maxFiles }),
		});

		// Çok fazla dosya seçildiği için yüklemenin reddedildiğini kontrol et
		cy.wrap(onRejectMock).should("be.calledOnceWith", errorMessages);
		cy.wrap(onAcceptMock).should("be.calledOnceWith", []);
		cy.wrap(onUploadMock).should("be.calledOnceWith", [], errorMessages);
	});

	// Özel hata mesajları renderlama testi
	it("Handles correct messages in rejections when custom messages added", () => {
		const maxSize = 1024 * 1024 * 2;
		const maxFiles = 2;

		const customValidationMessages: IFileError[] = [
			{
				code: DropzoneErrorCode.FileTooLarge,
				message: "custom validation message",
			},
		];

		setup({
			onUpload: onUploadMock,
			onUploadAccepted: onAcceptMock,
			onUploadRejected: onRejectMock,
			validationMessages: customValidationMessages,
			maxSize,
			maxFiles,
		});

		const input = cy.getByTestId("dropzone-input");

		const { fileContent: fileLargeContent, mimeType: fileLargeMimeType, fileName: fileLargeName } = fixtures["file-large.png"];

		const {
			fileContent: fileInvalidContent,
			mimeType: fileInvalidMimeType,
			fileName: fileInvalidName,
		} = fixtures["file-invalid.txt"];

		const { fileContent: fileValidContent, mimeType: fileValidMimeType, fileName: fileValidName } = fixtures["file-valid.png"];

		input.attachFile([
			{ fileContent: fileLargeContent, fileName: fileLargeName, mimeType: fileLargeMimeType },
			{ fileContent: fileInvalidContent, fileName: fileInvalidName, mimeType: fileInvalidMimeType },
			{ fileContent: fileValidContent, fileName: fileValidName, mimeType: fileValidMimeType },
		]);

		const errorMessages = validator({
			files: [fileLargeContent, fileInvalidContent, fileValidContent],
			maxSize,
			maxFiles,
			messages: formattedValidationMessages(defaultValidationMessages({ maxFiles }), customValidationMessages),
		});

		// Çok fazla dosya seçildiği için yüklemenin reddedildiğini kontrol et
		cy.wrap(onRejectMock).should("be.calledOnceWith", errorMessages);
		cy.wrap(onAcceptMock).should("be.calledOnceWith", []);
		cy.wrap(onUploadMock).should("be.calledOnceWith", [], errorMessages);
	});

	// Başlangıç dosyası yüklenme senaryosu
	it("Upload correctly initial files", () => {
		const { fileContent } = fixtures["file-valid.png"];

		setup({
			onUpload: onUploadMock,
			onUploadAccepted: onAcceptMock,
			onUploadRejected: onRejectMock,
			initialFiles: [fileContent],
		});

		// Çok fazla dosya seçildiği için yüklemenin reddedildiğini kontrol et
		cy.wrap(onRejectMock).should("be.calledOnceWith", []);
		cy.wrap(onAcceptMock).should("be.calledOnceWith", [fileContent]);
		cy.wrap(onUploadMock).should("be.calledOnceWith", [fileContent], []);
	});
});
