import { DATA_URLS } from "./config.js";

async function loadJson(url) {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

export async function loadKaomojiData() {
	const [kaomojis, options] = await Promise.all([loadJson(DATA_URLS.kaomojis), loadJson(DATA_URLS.parts)]);

	return { kaomojis, options };
}
