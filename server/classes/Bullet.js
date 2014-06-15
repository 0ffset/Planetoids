/**
 * Bullet class
 */

/***********************
** CONSTRUCTOR
************************/
function Bullet(startX, startY, startVelocity, spawnTime) {
	this.spawnX    = startX;        // X coordinate bullet spawned on
	this.spawnY    = startY;        // Y coordinate bullet spawned on
	this.velocity  = startVelocity; // Bullet's velocity
	this.spawnTime = spawnTime;     // Time of spawn
};

Bullet.prototype.constructor = Bullet;

/***********************
** CONSTANTS
************************/
Bullet.prototype.damage = 20; // Damage on bullet hit

exports.Bullet = Bullet;