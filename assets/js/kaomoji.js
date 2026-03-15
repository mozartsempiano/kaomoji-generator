import { COPY_PRE_TITLE } from "./modules/config.js";
import { createAudioManager } from "./modules/audio.js";
import { initClipboard } from "./modules/clipboard.js";
import { loadKaomojiData } from "./modules/data-loader.js";
import { initKaomojiGenerator } from "./modules/kaomoji-generator.js";
import { initKaomojiList } from "./modules/kaomoji-list.js";
import { initPreloader } from "./modules/preloader.js";
import { initTooltips } from "./modules/tooltips.js";

document.addEventListener("DOMContentLoaded", async () => {
	initPreloader();
	void initTooltips();

	const audio = createAudioManager();
	void audio.load();

	initClipboard({
		audio,
		preTitle: COPY_PRE_TITLE,
	});

	try {
		const { kaomojis, options } = await loadKaomojiData();
		initKaomojiList({ kaomojis, preTitle: COPY_PRE_TITLE });
		initKaomojiGenerator({ options, audio, preTitle: COPY_PRE_TITLE });
	} catch (error) {
		console.error("Failed to initialize the Kaomoji Generator.", error);
	}
});
