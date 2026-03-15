export function initPreloader() {
	window.addEventListener("load", () => {
		const preloader = document.getElementById("preloader");

		if (!preloader) {
			return;
		}

		window.setTimeout(() => {
			preloader.classList.add("hidden");

			window.setTimeout(() => {
				preloader.remove();
			}, 500);
		}, 500);
	});
}
