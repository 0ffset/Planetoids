/**
 * Game textures
 */
var texture = {
	/**
	 * Initialization
	 */
	init: function () {
		var img;
		
		for (tx in this) {
			if (this.hasOwnProperty(tx) && tx !== "init") {
				// Create new image object for each texture
				img = new Image();
				img.src = this[tx].src;
				
				// Set img property of each texture to the image object
				this[tx].img = img;
			}
		}
	},
	
	/**
	 * Textures
	 */
	asteroid: {
		src: "img/asteroid.png"
	}
};

window.texture = texture;