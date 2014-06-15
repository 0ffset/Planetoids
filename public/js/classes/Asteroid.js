/**
 * Asteroid class
 */
 
/***********************
** CONSTRUCTOR
************************/
function Asteroid(startX, startY, startRotation, startVelocity, startDiameter, startRotationSpeed) {
	var newAsteroid = new SpaceObject(startX, startY, startRotation, startVelocity);
	
	// Inherit properties from SpaceObject through newAsteroid
	for (prop in newAsteroid) {
		if (newAsteroid.hasOwnProperty(prop))
			this[prop] = newAsteroid[prop];
	}

	/***********************
	** VARIABLES
	************************/
	this.diameter      = startDiameter;      // Diameter of asteroid (px)
	this.rotationSpeed = startRotationSpeed; // Rotation speed of asteroid (rad/s)
	this.limbo         = false;              // Is true if asteroid has been shot and client is waiting for server to generate a new one
}

Asteroid.prototype = new SpaceObject();
Asteroid.prototype.constructor = Asteroid;

/***********************
** METHODS
************************/
// Update position on client side
Asteroid.prototype.update = function (td) {
	// Update rotation
	this.rotation += this.rotationSpeed * td;
	// Update position
	this.move(td);
}

// Draw on canvas
Asteroid.prototype.draw = function (ctx, canvasOffset) {
	var scale, tx;
	// Save rendering context
	ctx.save();
	
	// Set texture of asteroid
	tx = texture.asteroid.img;
	
	// Translate coordinates on and rotate rendering context
	ctx.translate(this.position.x - canvasOffset.x, this.position.y - canvasOffset.y);
	ctx.rotate(this.rotation);
	
	// Scale context in relation to ratio between asteroid diameter and texture width
	scale = this.diameter/tx.width;
	ctx.scale(scale, scale);
	
	// Draw the asteroid on the canvas
	ctx.fillStyle = ctx.createPattern(tx, "repeat");
	ctx.beginPath();
	ctx.arc(0, 0, tx.width/2, 0, Math.PI*2, true);
	ctx.closePath();
	ctx.fill();
	
	// Restore rendering context
	ctx.restore();
};

window.Asteroid = Asteroid;