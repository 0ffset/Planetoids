// Require parent class
var SpaceObject = require("./SpaceObject").SpaceObject;

/**
 * SpaceShip class
 */

/***********************
** CONSTRUCTOR
************************/
function SpaceShip(startX, startY, startRotation, startHealth, startHue) {
	var newSpaceShip = new SpaceObject(startX, startY, startRotation);
	
	// Inherit properties from SpaceObject through newSpaceShip
	for (prop in newSpaceShip) {
		if (newSpaceShip.hasOwnProperty(prop))
			this[prop] = newSpaceShip[prop];
	}
	
	/***********************
	** VARIABLES
	************************/
	this.health        = startHealth || 100; // Health of space ship
	this.hue           = startHue || 0;      // Hue of space ship color
	this.bullets       = [];                 // Bullets fired by the space object
	this.kills         = 0;                  // Enemies killed
	this.deaths        = 0;                  // Times died
	this.asteroidsShot = 0;                  // Number of asteroids destroyed
	this.pingArray     = [];                 // Keep the last 5 ping measures in an array
};

SpaceShip.prototype = new SpaceObject();
SpaceShip.prototype.constructor = SpaceShip;

/***********************
** CONSTANTS
************************/
SpaceShip.prototype.width  = 15; // Width of the space ship (px)
SpaceShip.prototype.height = 30; // Height of the space ship (px)

/***********************
** METHODS
************************/
/**
 * Return an object with data of a new player to be transmitted to client
 */
SpaceShip.prototype.getNewPlayerData = function () {
	return {
		id:            this.id,
		alias:         this.alias,
		x:             this.x,
		y:             this.y,
		rotation:      this.rotation,
		health:        this.health,
		kills:         this.kills,
		deaths:        this.deaths,
		asteroidsShot: this.asteroidsShot,
		hue:           this.hue
	};
};

/**
 * Retrieve player score
 */
SpaceShip.prototype.score = function () {
	var killScore     = 200, // Score for killing an enemy
			asteroidScore = 20;  // Score for destroying an asteroid
	
	return this.kills*killScore + this.asteroidsShot*asteroidScore - this.deaths*killScore;
};

/**
 * Get player ping (returns an average of last ping values)
 */
SpaceShip.prototype.getPing = function () {
	var i, n, pingSum, pingAvg;
	
	pingSum = 0;
	n = this.pingArray.length;
	for (i = 0; i < n; i++) {
		pingSum += this.pingArray[i];
	}
	
	pingAvg = pingSum / n;
	
	return parseInt(pingAvg, 10);
};

/**
 * Reset player statistics
 */
SpaceShip.prototype.resetStats = function () {
	this.health        = 100;
	this.kills         = 0;
	this.deaths        = 0;
	this.asteroidsShot = 0;
};

exports.SpaceShip = SpaceShip;