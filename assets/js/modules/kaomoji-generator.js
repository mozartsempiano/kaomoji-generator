import { COPY_PRE_TITLE, EMPTY_OPTION_LABEL } from "./config.js";
import { applyCopyTitle, setCopyEnabled } from "./clipboard.js";

export function initKaomojiGenerator({ options, audio, preTitle = COPY_PRE_TITLE } = {}) {
	const inputsContainer = document.getElementById("generator-inputs");
	const preview = document.querySelector("#kaomoji-preview pre");
	const randomButton = document.getElementById("generate-random");
	const diceOverlay = document.getElementById("dice-overlay");

	if (!inputsContainer || !preview || !randomButton) {
		return;
	}

	const parts = {};
	const slotMachineActive = true;

	inputsContainer.innerHTML = "";
	applyCopyTitle(preview, preTitle);
	setCopyEnabled(preview, true, preTitle);

	Object.entries(options).forEach(([part, values]) => {
		const label = document.createElement("label");
		label.textContent = `${part}: `;

		const select = document.createElement("select");
		values.forEach((value, index) => {
			const option = document.createElement("option");
			option.value = value;
			option.textContent = `${index + 1}. ${value || EMPTY_OPTION_LABEL}`;
			select.appendChild(option);
		});

		parts[part] = select;
		label.appendChild(select);
		inputsContainer.append(label, document.createElement("br"));
	});

	function updateKaomoji() {
		const kaomoji = `${parts.extraLeft.value}${parts.armLeft.value}${parts.faceLeft.value}${parts.eyeLeft.value}${parts.mouth.value}${parts.eyeRight.value}${parts.faceRight.value}${parts.armRight.value}${parts.extraRight.value}`;
		preview.textContent = kaomoji;
	}

	function animatePart(select, targetIndex, callback) {
		let current = select.selectedIndex;
		const step = targetIndex > current ? 1 : -1;
		let remainingSteps = Math.abs(targetIndex - current);
		let delay = 20;

		function frame() {
			current += step;

			if (current < 0) {
				current = select.options.length - 1;
			}

			if (current >= select.options.length) {
				current = 0;
			}

			select.selectedIndex = current;
			updateKaomoji();
			audio?.playTick?.();

			remainingSteps -= 1;

			if (remainingSteps > 0) {
				delay += 5;
				window.setTimeout(frame, delay);
				return;
			}

			select.selectedIndex = targetIndex;
			updateKaomoji();
			callback?.();
		}

		frame();
	}

	function animateOrChange(select, targetIndex, callback) {
		if (slotMachineActive) {
			animatePart(select, targetIndex, callback);
			return;
		}

		select.selectedIndex = targetIndex;
		updateKaomoji();
		callback?.();
	}

	Object.values(parts).forEach((select) => {
		select.addEventListener("change", updateKaomoji);
	});

	randomButton.addEventListener("click", () => {
		diceOverlay?.classList.add("animate");
		setCopyEnabled(preview, false, preTitle);

		const idxFace = Math.floor(Math.random() * options.faceLeft.length);
		const idxEye = Math.floor(Math.random() * options.eyeLeft.length);
		const idxMouth = Math.floor(Math.random() * options.mouth.length);
		const idxArmLeft = Math.floor(Math.random() * options.armLeft.length);
		const idxArmRight = Math.floor(Math.random() * options.armRight.length);
		let idxExtraLeft = Math.floor(Math.random() * options.extraLeft.length);
		let idxExtraRight = Math.floor(Math.random() * options.extraRight.length);

		if (idxExtraLeft === 6 || idxExtraRight === 6) {
			idxExtraLeft = 6;
			idxExtraRight = 6;
		} else if (idxExtraLeft === 10 || idxExtraRight === 10) {
			idxExtraLeft = 10;
			idxExtraRight = 10;
		}

		if (slotMachineActive) {
			animateOrChange(parts.faceLeft, idxFace);
			animateOrChange(parts.faceRight, idxFace);

			window.setTimeout(() => {
				animateOrChange(parts.eyeLeft, idxEye);
				animateOrChange(parts.eyeRight, idxEye);
			}, 200);

			window.setTimeout(() => {
				animateOrChange(parts.mouth, idxMouth);
			}, 400);

			window.setTimeout(() => {
				animateOrChange(parts.armLeft, idxArmLeft);
				animateOrChange(parts.armRight, idxArmRight);
			}, 600);

			window.setTimeout(() => {
				animateOrChange(parts.extraLeft, idxExtraLeft);
				animateOrChange(parts.extraRight, idxExtraRight);
			}, 800);
		} else {
			parts.faceLeft.selectedIndex = idxFace;
			parts.faceRight.selectedIndex = idxFace;
			parts.eyeLeft.selectedIndex = idxEye;
			parts.eyeRight.selectedIndex = idxEye;
			parts.mouth.selectedIndex = idxMouth;
			parts.armLeft.selectedIndex = idxArmLeft;
			parts.armRight.selectedIndex = idxArmRight;
			parts.extraLeft.selectedIndex = idxExtraLeft;
			parts.extraRight.selectedIndex = idxExtraRight;
			updateKaomoji();
		}

		window.setTimeout(() => {
			diceOverlay?.classList.remove("animate");
			setCopyEnabled(preview, true, preTitle);
		}, 1500);
	});

	updateKaomoji();
}
