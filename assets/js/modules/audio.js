const AUDIO_FILES = {
	tick: "/assets/wav/random_tick.wav",
	copySuccess: "/assets/wav/copy_success.wav",
	copyFail: "/assets/wav/copy_fail.wav",
};

const NO_OP_AUDIO_MANAGER = Object.freeze({
	load() {
		return Promise.resolve();
	},
	playTick() {},
	playCopySuccess() {},
	playCopyFail() {},
});

async function loadBuffer(audioContext, url) {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to load audio ${url}: ${response.status}`);
	}

	const audioData = await response.arrayBuffer();
	return audioContext.decodeAudioData(audioData);
}

function playBuffer(audioContext, buffer, { volume, attack, release }) {
	if (!buffer) {
		return;
	}

	if (audioContext.state === "suspended") {
		audioContext.resume().catch(() => {});
	}

	const source = audioContext.createBufferSource();
	source.buffer = buffer;

	const gain = audioContext.createGain();
	gain.gain.value = 0.0001;

	source.connect(gain).connect(audioContext.destination);

	const now = audioContext.currentTime;
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), now + attack);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + release);

	source.start(now);
	source.stop(now + buffer.duration + 0.02);
}

export function createAudioManager() {
	const AudioContextClass = window.AudioContext || window.webkitAudioContext;

	if (!AudioContextClass) {
		return NO_OP_AUDIO_MANAGER;
	}

	const audioContext = new AudioContextClass();
	const buffers = {
		tick: null,
		copySuccess: null,
		copyFail: null,
	};

	async function load() {
		const audioEntries = Object.entries(AUDIO_FILES);
		const results = await Promise.allSettled(
			audioEntries.map(async ([key, url]) => {
				buffers[key] = await loadBuffer(audioContext, url);
			})
		);

		results.forEach((result, index) => {
			if (result.status === "rejected") {
				console.warn(`Failed to load ${audioEntries[index][0]} audio.`, result.reason);
			}
		});
	}

	return {
		load,
		playTick(volume = 0.55) {
			playBuffer(audioContext, buffers.tick, { volume, attack: 0.001, release: 0.12 });
		},
		playCopySuccess(volume = 0.4) {
			const buffer = buffers.copySuccess;

			if (!buffer) {
				return;
			}

			playBuffer(audioContext, buffer, { volume, attack: 0.01, release: buffer.duration });
		},
		playCopyFail(volume = 0.5) {
			const buffer = buffers.copyFail;

			if (!buffer) {
				return;
			}

			playBuffer(audioContext, buffer, { volume, attack: 0.005, release: buffer.duration });
		},
	};
}
