import { COPY_NOTIFICATION_TEXTS, COPY_PRE_TITLE } from "./config.js";

function ensureNotificationElement(defaultText) {
	let notification = document.getElementById("copy-notification");

	if (!notification) {
		notification = document.createElement("div");
		notification.id = "copy-notification";
		document.body.appendChild(notification);
	}

	if (!notification.textContent) {
		notification.textContent = defaultText;
	}

	return notification;
}

async function writeTextToClipboard(text) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (error) {
		console.error("Error copying with clipboard.writeText:", error);
	}

	try {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.setAttribute("readonly", "");
		textarea.style.position = "absolute";
		textarea.style.left = "-9999px";
		document.body.appendChild(textarea);

		textarea.select();
		textarea.setSelectionRange(0, textarea.value.length);

		const successful = document.execCommand("copy");
		document.body.removeChild(textarea);
		return successful;
	} catch (error) {
		console.error("Clipboard fallback failed:", error);
		return false;
	}
}

export function applyCopyTitle(element, title = COPY_PRE_TITLE) {
	if (element) {
		element.title = title;
	}
}

export function setCopyEnabled(element, enabled, title = COPY_PRE_TITLE) {
	if (!element) {
		return;
	}

	element.dataset.copyDisabled = enabled ? "false" : "true";
	element.style.userSelect = enabled ? "auto" : "none";
	element.style.cursor = enabled ? "pointer" : "progress";
	element.title = enabled ? title : "";
}

export function initClipboard({
	root = document.getElementById("container-kaomoji"),
	audio,
	texts = COPY_NOTIFICATION_TEXTS,
	preTitle = COPY_PRE_TITLE,
} = {}) {
	if (!root || root.dataset.clipboardInit === "1") {
		return;
	}

	const notification = ensureNotificationElement(texts.SUCCESS);
	const timeoutMs = 3000;
	let notificationTimeout = null;

	root.addEventListener("click", async (event) => {
		const pre = event.target.closest("pre");

		if (!pre || !root.contains(pre)) {
			return;
		}

		if (pre.dataset.copyDisabled === "true" || pre.style.cursor === "progress" || pre.style.userSelect === "none") {
			return;
		}

		if (!pre.title) {
			pre.title = preTitle;
		}

		if (notificationTimeout) {
			window.clearTimeout(notificationTimeout);
		}

		notification.className = "";

		const copied = await writeTextToClipboard(pre.textContent);

		if (copied) {
			notification.textContent = texts.SUCCESS;
			notification.classList.add("show", "notifSuccess");
			audio?.playCopySuccess?.();
		} else {
			notification.textContent = texts.ERROR;
			notification.classList.add("show", "notifError");
			audio?.playCopyFail?.();
		}

		notificationTimeout = window.setTimeout(() => {
			notification.classList.remove("show", "notifSuccess", "notifError");
			notificationTimeout = null;
		}, timeoutMs);
	});

	root.dataset.clipboardInit = "1";
}
