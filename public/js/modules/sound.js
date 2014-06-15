/**
 * Sound effects
 */
var sound = {
	/**
	 * Settings
	 */
	// If sound is muted
	muted: false,
	
	// Toggle sound on/off
	muteToggle: function () {
		var soundTag = document.getElementById("sound");
		if (this.muted) {
			this.muted = false;
			soundTag.className = "on";
		} else {
			this.muted = true;
			soundTag.className = "off";
		}
	},
	
	// Initialize sounds
	init: function () {
		var i, j,
				audioDiv,   // The main audio elements container
				audioGroup, // A container for one group of audio elements
				audioTag,   // A specific audio element
				file,       // The audio source file
				soundTag;   // The sound settings element
		
		// Create the audio elements container
		audioDiv = document.createElement("div");
		audioDiv.id = "audio-container"
		document.body.appendChild(audioDiv);
		
		// Append audio elements to audio div
		for (fx in this) {
			// Only continue with the property if it is sound's own and is in fact a sound effect
			if (this.hasOwnProperty(fx) && this.notSounds.indexOf(fx) === -1) {
				// Add play function to each sound effect
				this[fx].name = fx;
				this[fx].play = function (volume) {
					// Pick one of the provided source files at random
					var imin = 0,
							imax = this.files.length - 1,
							i = Math.floor(Math.random() * (imax - imin + 1)) + imin;
					// Play that file
					sound.play(this.name + "-" + i, volume);
				};
				// Create an audio group for each source file of the sound effect
				for (i = 0; i < this[fx].files.length; i++) {
					audioGroup = document.createElement("div");
					audioGroup.id = fx + "-" + i;
					audioDiv.appendChild(audioGroup);
					file = this[fx].files[i];
					// Create 5 elements for each source file to act as a buffer (so same sounds can overlap)
					for (j = 0; j < 5; j++) {
						audioTag = document.createElement("audio");
						audioTag.id = fx + "-" + i + "-" + j;
						audioTag.src = file;
						audioGroup.appendChild(audioTag);
						audioTag.load();
					}
				}
			}
		}
		
		// Set up sound div for showing if sound is on/off
		soundTag = document.getElementById("sound");
		soundTag.className = "on";
	},
	
	// Play audio tag from audio group id
	play: function (id, volume) {
		var i, audioTag, audioGroup;
		
		// Return if sound is muted
		if (this.muted) return;
		
		// Set volume of playback
		volume = volume || 1;
		
		// Get audio group
		audioGroup = document.getElementById(id);
		
		// Play first audio element in audio group that is not already playing
		for (i = 0; i < audioGroup.childNodes.length; i++) {
			audioTag = audioGroup.childNodes[i];
			if (audioTag.currentTime === 0 || audioTag.currentTime === audioTag.duration) {
				audioTag.volume = volume;
				audioTag.play();
				return;
			}
		}
		
		// If no tag started to play, rewind first child and play
		audioTag = audioGroup.childNodes[0];
		audioTag.volume = volume;
		audioTag.play();
	},
	
	// Keep properties that are not sounds in an array (to disregard them on initialization)
	notSounds: ["muted", "muteToggle", "init", "play", "notSounds"],
	
	/**
	 * Sounds
	 */
	// Shoot sounds
	shoot: {
		files: ["audio/shoot1.wav", "audio/shoot2.wav"]
	},
	
	// Hit sounds
	hit: {
		files: ["audio/hit.wav"]
	},
	
	// Explode sounds
	explode: {
		files: ["audio/explode.wav"]
	}
};

window.sound = sound;