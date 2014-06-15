/**
 * SmokeBubble class (for making smoke effect)
 */

/***********************
** CONSTRUCTOR
************************/
function SmokeBubble(startX, startY, startHue, startVelocity, startRadius) {
	this.position = new Vector(startX, startY);        // Current position
	this.velocity = startVelocity || new Vector(0, 0); // Current velocity
	this.hue      = startHue || 0;                     // Color hue
	this.radius   = startRadius || 3;                  // Radius
	this.opacity  = 0.3;                               // Opacity
	this.damping  = 0.4;                               // Damping to increase velocity over time
}

SmokeBubble.prototype.constructor = SmokeBubble;

/***********************
** METHODS
************************/
/**
 * Update
 */
SmokeBubble.prototype.update = function (td) {
	// Increase radius
	this.radius += 0.2;
	
	// Decrease opacity (for fade out effect)
	this.opacity *= 0.97;
	
	// Move the bubble according to velocity
	this.position.iAddVector(this.velocity.mulScalar(td));
	
	// Slow the velocity down in relation to damping
	this.velocity.iMulScalar(1 / (1 + this.damping*td));
}

/**
 * Draw
 */
SmokeBubble.prototype.draw = function (ctx, canvasOffset) {
	// Save rendering context
	ctx.save();
	
	// Translate coordinates
	ctx.translate(this.position.x - canvasOffset.x, this.position.y - canvasOffset.y);
	
	// Draw bubble
	ctx.fillStyle = "hsla(" + this.hue + ", 50%, 75%, " + this.opacity + ")";
	ctx.beginPath();
	ctx.arc(0, 0, this.radius, 0, Math.PI*2, true);
	ctx.closePath();
	ctx.fill();
	
	// Restore rendering context
	ctx.restore();
}

window.SmokeBubble = SmokeBubble;