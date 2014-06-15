/**
 * Bullet class (bullets fired by space ships)
 */

/***********************
** CONSTRUCTOR
************************/
function Bullet(startX, startY, startVelocity) {
	var newBullet = new SpaceObject(startX, startY, 0, startVelocity);
	
	// Inherit properties from SpaceObject through newBullet
	for (prop in newBullet) {
		if (newBullet.hasOwnProperty(prop))
			this[prop] = newBullet[prop];
	}

	/***********************
	** VARIABLES
	************************/
	this.spawnTime = Date.now(); // The time bullet was fired
	this.spawnX    = startX;     // X coordinate where bullet was fired
	this.spawnY    = startY;     // Y coordinate where bullet was fired
}

Bullet.prototype = new SpaceObject();
Bullet.prototype.constructor = Bullet;

/***********************
** CONSTANTS
************************/
Bullet.prototype.width  = 3;   // Width of bullet (px)
Bullet.prototype.speed  = 500; // Speed of bullet (px/s)
Bullet.prototype.damage = 20;  // Damage a bullet does on hit

/***********************
** METHODS
************************/
/**
 * Update properties
 */
Bullet.prototype.update = function (td) {		
	// Update position
	this.move(td);
};

/**
 * Draw on canvas
 */
Bullet.prototype.draw = function (ctx, canvasOffset) {
	// Save rendering context
	ctx.save();
	
	// Translate coordinates on rendering context
	ctx.translate(this.position.x - canvasOffset.x, this.position.y - canvasOffset.y);		
	
	// Draw the bullet on the canvas
	ctx.fillStyle = "#fff";
	ctx.beginPath();
	ctx.arc(0, 0, this.width/2, 0, Math.PI*2, true);
	ctx.fill();
	
	// Restore rendering context
	ctx.restore();
};

window.Bullet = Bullet;