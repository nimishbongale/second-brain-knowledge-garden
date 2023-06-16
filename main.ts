import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
} from "obsidian";
const keyword_extractor = require("keyword-extractor");
import fetch, { AbortError } from "node-fetch";

interface KnowledgeGardenSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: KnowledgeGardenSettings = {
	mySetting: "default",
};

export default class KnowledgeGarden extends Plugin {
	settings: KnowledgeGardenSettings;

	summarizeText = (text: string) => {
		const cohere = require("cohere-ai");
		cohere.init("Lh999GxxZj2soQvi7oviV3z4N8H6MK8lLOxtgsG6"); // This is your trial API key
		(async () => {
			const response = await cohere.summarize({
				text: text,
				format: "bullets",
				model: "summarize-xlarge",
				additional_command: "",
				temperature: 0.1,
			});
			console.log("Summary:", response.body.summary);
			new Notice(response.body.summary, 0);
		})();
	};

	createNode = async (
		newFileName?: string,
		fileContent?: string
	): Promise<any> => {
		const fileName: string =
			(newFileName ? newFileName + "_" : "") +
			new Date()
				.toISOString()
				// @ts-ignore
				.replaceAll(":", "-");
		new Notice(`Created ${fileName}.md Note!`, 0);

		// TODO: Think about data to stuff within a new file
		const file = await this.app.vault.create(
			fileName + ".md",
			fileContent ?? ""
		);
		return {
			fileName,
			fileContent,
			file,
		};
	};

	autocultivate = async () => {
		// Add relevant group of notes linked to root (common topic summary)
		// Create [1,3] files, backlink to temp root
		// Backlink to [1, 3] existing files
		// Attach to root this new page
		// run an autocultivate on CRON (small CRON for demo)

		// random number from 1 to 3
		const randomNumber: number = Math.floor(Math.random() * 3) + 1;

		// global root
		const root = this.app.vault.getFiles()?.[0];

		// local root
		const {
			fileName: localRootFileName,
			fileContent,
			file: localRoot,
		} = await this.createNode("localroot", "");

		// create group of nodes, attach to local root
		// get most frequent tags/based on relevance
		// VNqYTzse9q6L-VLfNz9ZAgFqGPYdYF-4yWvL634CzuQ
		for (let i = 1; i <= randomNumber; i++) {
			var url = "https://v3-api.newscatcherapi.com/api/search?q=AWS";

			const allFiles = this.app.vault.getFiles();

			const reactFile = allFiles?.find(
				(file: TFile) => "React Augmentation.md" === file.name
			);

			const { fileName, fileContent, file } = await this.createNode(
				undefined,
				(await this.app.vault.read(reactFile as TFile)) as string
			);
			this.app.vault.append(file, `[[${localRootFileName}.md]]`);
			// });
		}

		// attach local root to global root
		this.app.vault.append(root, `[[${localRootFileName}.md]]`);
	};

	async onload() {
		this.addRibbonIcon(
			"create-new",
			"Plant your data seed",
			// onClick
			() => {
				this.createNode();
			}
		);

		this.addRibbonIcon(
			"star-list",
			"Organize your plants",
			// onClick
			async () => {
				const activeFile = (await this.app.workspace.activeEditor
					?.file) as TFile;
				const fileContent: string = await this.app.vault.read(
					activeFile
				);
				const extraction_result = keyword_extractor.extract(
					fileContent,
					{
						language: "english",
						remove_digits: true,
						return_changed_case: true,
						remove_duplicates: true,
					}
				);
				const topTags = extraction_result
					.sort((a: string, b: string) => b.length - a.length)
					.slice(0, 5);

				const topTagsString: string = " #" + topTags?.join(" #");
				this.app.vault.append(activeFile, topTagsString);
			}
		);

		this.addRibbonIcon(
			"blocks",
			"Cultivate your plants",
			// onClick
			async () => {
				new Notice("Autocultivate", 0);
				this.autocultivate();
			}
		);

		this.addRibbonIcon(
			"star",
			"Harvest your fruits",
			// onClick
			async () => {
				new Notice("Autoharvest", 0);
				// Summary digest report, use Notification (Flash Card concept)
				// getLastModifiedFiles, run summarizer (ChatGPT)
				const recentFiles: any =
					// @ts-ignore
					this.app.workspace?.recentFileTracker?.lastOpenFiles.slice(
						0,
						3
					);
				const allFiles = this.app.vault.getFiles();
				console.error("recentFiles", recentFiles);
				const neededFiles = allFiles?.filter((file: TFile) =>
					recentFiles.includes(file?.path)
				);

				let recentFileContents: any = "";
				neededFiles?.forEach(async (file: TFile) => {
					const abc = await this.app.vault.read(file);
					recentFileContents += abc;
				});

				setTimeout(() => {
					console.log(recentFileContents);
					if (recentFileContents.length > 500) {
						this.summarizeText(recentFileContents);
					} else {
						this.summarizeText(
							"{:<499}".format(recentFileContents)
						);
					}
				}, 5000);
			}
		);

		this.addRibbonIcon(
			"crossed-star",
			"Prune your trees",
			//onClick
			() => {
				new Notice("Intelligent Pruning", 0);
				const lastOpenFiles: any =
					// @ts-ignore
					this.app.workspace?.recentFileTracker?.lastOpenFiles;
				const randomNumber: number = Math.floor(Math.random() * 3) + 1;
				const recentFiles: any = lastOpenFiles?.slice(
					Math.max(lastOpenFiles.length - randomNumber, 0)
				);
				const allFiles = this.app.vault.getFiles();

				const neededFiles = allFiles?.filter((file: TFile) =>
					recentFiles?.includes(file.name)
				);
				neededFiles?.forEach((element: any) => {
					this.app.vault.append(element, "[[archive.md]]");
				});
			}
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: KnowledgeGarden;

	constructor(app: App, plugin: KnowledgeGarden) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for my awesome plugin." });

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						console.log("Secret: " + value);
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
