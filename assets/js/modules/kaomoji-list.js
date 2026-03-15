import { COPY_PRE_TITLE } from "./config.js";
import { applyCopyTitle } from "./clipboard.js";

function createTagCounts(allTags, kaomojis) {
	const counts = Object.fromEntries(allTags.map((tag) => [tag, 0]));

	kaomojis.forEach(({ tags }) => {
		tags.forEach((tag) => {
			if (counts[tag] !== undefined) {
				counts[tag] += 1;
			}
		});
	});

	return counts;
}

export function initKaomojiList({ kaomojis, preTitle = COPY_PRE_TITLE } = {}) {
	const list = document.getElementById("kaomoji-list");

	if (!list) {
		return;
	}

	const sortOrder = "desc";
	const activeFilters = new Set();
	const allTags = ["All", ...Array.from(new Set(kaomojis.flatMap(({ tags }) => tags))).sort((left, right) => left.localeCompare(right))];
	const btnFilters = document.querySelectorAll(".btn-filter");
	const popupFiltersAll = document.querySelectorAll(".popup-filters");
	const popupLists = document.querySelectorAll(".popup-filters-list");
	const btnClears = document.querySelectorAll(".btn-clear");
	const searchInputs = document.querySelectorAll(".popup-search-input");
	const searchClearButtons = document.querySelectorAll(".popup-search-clear");
	let searchQuery = "";

	function updateUrl() {
		if (activeFilters.size === 0) {
			history.replaceState(null, "", window.location.pathname);
			return;
		}

		const tagsParam = Array.from(activeFilters).join(",");
		history.replaceState(null, "", `?tags=${encodeURIComponent(tagsParam)}`);
	}

	function loadFiltersFromUrl() {
		const params = new URLSearchParams(window.location.search);
		const tagsParam = params.get("tags");

		if (!tagsParam) {
			return;
		}

		tagsParam.split(",").forEach((tag) => {
			if (tag !== "All" && allTags.includes(tag)) {
				activeFilters.add(tag);
			}
		});
	}

	function getFilteredKaomojis() {
		if (activeFilters.size === 0) {
			return kaomojis;
		}

		return kaomojis.filter(({ tags }) => Array.from(activeFilters).every((filterTag) => tags.includes(filterTag)));
	}

	function renderKaomojis(filteredList) {
		list.innerHTML = "";
		const sortedKaomojis = sortOrder === "desc" ? [...filteredList].reverse() : [...filteredList];

		sortedKaomojis.forEach((kaomoji) => {
			const container = document.createElement("div");
			container.className = "kaomoji-item";

			const pre = document.createElement("pre");
			pre.textContent = kaomoji.text;
			pre.style.cursor = "pointer";
			applyCopyTitle(pre, preTitle);
			container.appendChild(pre);

			const tagsDiv = document.createElement("div");
			tagsDiv.className = "tags";

			kaomoji.tags.forEach((tag) => {
				const span = document.createElement("span");
				span.textContent = tag;
				span.style.cursor = "pointer";
				span.style.marginRight = "6px";
				span.classList.toggle("selected", activeFilters.has(tag));
				span.addEventListener("click", () => {
					if (activeFilters.has(tag)) {
						activeFilters.delete(tag);
					} else {
						activeFilters.add(tag);
					}

					updateFilters();
				});

				tagsDiv.appendChild(span);
			});

			container.appendChild(tagsDiv);
			list.appendChild(container);
		});
	}

	function updateClearButtons() {
		btnClears.forEach((button) => {
			const enabled = activeFilters.size > 0;
			button.toggleAttribute("disabled", !enabled);
			button.setAttribute("aria-disabled", enabled ? "false" : "true");
		});
	}

	function applySearchQuery() {
		const normalizedQuery = searchQuery.toLowerCase().trim();

		popupLists.forEach((popupList) => {
			popupList.querySelectorAll(".popup-item").forEach((item) => {
				const label = item.querySelector(".popup-label")?.textContent?.toLowerCase() ?? "";
				item.style.display = label.includes(normalizedQuery) ? "flex" : "none";
			});
		});
	}

	function setSearchQuery(nextQuery) {
		searchQuery = nextQuery;

		searchInputs.forEach((input) => {
			input.value = nextQuery;
		});

		searchClearButtons.forEach((button) => {
			button.hidden = nextQuery.length === 0;
		});

		applySearchQuery();
	}

	function renderPopupTags() {
		const counts = createTagCounts(allTags, kaomojis);

		popupLists.forEach((popupList) => {
			popupList.innerHTML = "";
		});

		allTags.forEach((tag) => {
			const isAll = tag === "All";
			const checked = isAll ? activeFilters.size === 0 : activeFilters.has(tag);

			popupLists.forEach((popupList, popupIndex) => {
				const row = document.createElement("div");
				row.className = "popup-item";
				row.tabIndex = 0;
				row.dataset.tag = tag;
				row.setAttribute("role", "checkbox");
				row.setAttribute("aria-checked", checked ? "true" : "false");

				const checkbox = document.createElement("span");
				checkbox.className = "popup-checkbox";
				checkbox.innerHTML =
					'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"></path></svg>';

				const label = document.createElement("span");
				label.className = "popup-label";
				label.textContent = tag;

				const count = document.createElement("span");
				count.className = "popup-count";
				count.textContent = isAll ? `(${kaomojis.length})` : `(${counts[tag] || 0})`;

				row.append(checkbox, label, count);

				function toggleTag() {
					if (isAll) {
						activeFilters.clear();
					} else if (activeFilters.has(tag)) {
						activeFilters.delete(tag);
					} else {
						activeFilters.add(tag);
					}

					updateFilters();

					window.requestAnimationFrame(() => {
						const nextRow = Array.from(popupLists[popupIndex]?.querySelectorAll(".popup-item") || []).find((item) => item.dataset.tag === tag);
						nextRow?.focus();
					});
				}

				row.addEventListener("click", (event) => {
					event.stopPropagation();
					toggleTag();
				});

				row.addEventListener("keydown", (event) => {
					if (event.key === " " || event.key === "Enter") {
						event.preventDefault();
						event.stopPropagation();
						toggleTag();
					}

					if (event.key === "Escape") {
						event.stopPropagation();
						const popup = row.closest(".popup-filters");
						const popupIndexFromRow = Array.from(popupFiltersAll).indexOf(popup);

						if (popupIndexFromRow !== -1) {
							closePopup(popup, btnFilters[popupIndexFromRow]);
						}
					}
				});

				popupList.appendChild(row);
			});
		});

		applySearchQuery();
	}

	function updateFilters() {
		renderKaomojis(getFilteredKaomojis());
		updateClearButtons();
		updateUrl();
		renderPopupTags();
	}

	function openPopup(popup, button, popupList) {
		popup.hidden = false;
		popup.setAttribute("aria-hidden", "false");
		popup.setAttribute("aria-modal", "true");
		button.setAttribute("aria-expanded", "true");
		setSearchQuery("");

		const firstRow = popupList.querySelector("[role='checkbox']");
		firstRow?.focus();
	}

	function closePopup(popup, button) {
		popup.hidden = true;
		popup.setAttribute("aria-hidden", "true");
		popup.removeAttribute("aria-modal");
		button.setAttribute("aria-expanded", "false");
		button.focus();
	}

	btnFilters.forEach((button, index) => {
		const popup = popupFiltersAll[index];
		const popupList = popupLists[index];

		button.addEventListener("click", () => {
			if (!popup) {
				return;
			}

			if (popup.hidden) {
				openPopup(popup, button, popupList);
			} else {
				closePopup(popup, button);
			}
		});
	});

	btnClears.forEach((button, index) => {
		button.addEventListener("click", () => {
			if (activeFilters.size === 0) {
				return;
			}

			activeFilters.clear();
			updateFilters();

			const firstRow = popupLists[index]?.querySelector("[role='checkbox']");
			firstRow?.focus();
		});
	});

	searchInputs.forEach((input) => {
		input.addEventListener("input", (event) => {
			setSearchQuery(event.target.value);
		});
	});

	searchClearButtons.forEach((button, index) => {
		button.addEventListener("click", () => {
			setSearchQuery("");
			searchInputs[index]?.focus();
		});
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			popupFiltersAll.forEach((popup, index) => {
				if (!popup.hidden) {
					closePopup(popup, btnFilters[index]);
				}
			});
		}
	});

	document.addEventListener("click", (event) => {
		const target = event.target;

		popupFiltersAll.forEach((popup, index) => {
			if (popup.hidden || popup.contains(target)) {
				return;
			}

			const filterButton = btnFilters[index];
			const clearButton = btnClears[index];

			if (filterButton?.contains(target) || clearButton?.contains(target)) {
				return;
			}

			closePopup(popup, filterButton);
		});
	});

	document.addEventListener("keydown", (event) => {
		if (event.key !== "Tab") {
			return;
		}

		popupFiltersAll.forEach((popup) => {
			if (popup.hidden) {
				return;
			}

			const focusable = popup.querySelectorAll("[role='checkbox'], button:not([disabled]), input");

			if (focusable.length === 0) {
				return;
			}

			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		});
	});

	loadFiltersFromUrl();
	updateFilters();
}
