const TOOLTIP_OPTIONS = {
	tipFollowsCursor: true,
	tipDelay: 0,
	tipFadeSpeed: 0,
	attribute: "title",
};

export async function initTooltips() {
	try {
		const { enableTooltips } = await import("/assets/js/jquery.style-my-tooltips.js");

		if (typeof enableTooltips === "function") {
			enableTooltips(TOOLTIP_OPTIONS);
		}
	} catch (error) {
		console.warn("Tooltip module could not be loaded.", error);
	}
}
