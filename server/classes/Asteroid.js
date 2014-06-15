// Require parent class
var SpaceObject = require("./SpaceObject").SpaceObject;

/**
 * Asteroid class
 */

/***********************
** CONSTRUCTOR
************************/
function Asteroid(startX, startY, startRotation, startVelocity, startRotationSpeed, startDiameter) {
	var newAsteroid = new SpaceObject(startX, startY);
	
	// Inherit properties from SpaceObject through newAsteroid
	for (prop in newAsteroid) {
		if (newAsteroid.hasOwnProperty(prop))
			this[prop] = newAsteroid[prop];
	}
	
	/***********************
	** VARIABLES
	************************/
	this.rotation      = startRotation;      // Rotation of asteroid
	this.velocity      = startVelocity;      // Velocity of asteroid (vector, px/s)
	this.rotationSpeed = startRotationSpeed; // Rotation speed of asteroid (rad/s)
	this.diameter      = startDiameter;      // Diameter of asteroid
	this.spawnTime     = Date.now();         // Time when asteroid spawned
	this.spawnX        = startX;             // X coordinate on spawn
	this.spawnY        = startY;             // Y coordinate on spawn
};

Asteroid.prototype = new SpaceObject();
Asteroid.prototype.constructor = Asteroid;

/***********************
** CONSTANTS
************************/
Asteroid.prototype.updateRate = 500; // Time between each update of asteroid position (ms)

/***********************
** METHODS
************************/
/**
 * Return an object with data of new asteroid to be transmitted to client
 */
Asteroid.prototype.getNewAsteroidData = function () {
	return {
		index:         this.index,
		spawnX:        this.spawnX,
		spawnY:        this.spawnY,
		rotation:      this.rotation,
		velocity:      this.velocity,
		diameter:      this.diameter,
		rotationSpeed: this.rotationSpeed,
		timeExisted:   (Date.now() - this.spawnTime)
	};
};

exports.Asteroid = Asteroid;