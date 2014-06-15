/**
 * SpaceShip class
 */
 
/***********************
** CONSTRUCTOR
************************/
function SpaceShip(startX, startY, startRotation, startHealth, startKills, startDeaths, startAsteroidsShot, startHue) {
	var newSpaceShip = new SpaceObject(startX, startY, startRotation);
	
	// Inherit properties from SpaceObject through newSpaceShip
	for (prop in newSpaceShip) {
		if (newSpaceShip.hasOwnProperty(prop))
			this[prop] = newSpaceShip[prop];
	}
	
	/***********************
	** VARIABLES
	************************/
	this.bullets        = [];                      // Bullets fired by space ship
	this.bulletsShot    = 0;                       // Total number of bullets shot by space ship
	this.lastShot       = 0;                       // Last time a bullet was shot
	this.health         = startHealth || 100;      // Health of space ship
	this.alias          = "Unknown";               // Alias of player
	this.kills          = startKills  || 0;        // Times space ship killed another player
	this.deaths         = startDeaths || 0;        // Times space ship died
	this.asteroidsShot  = startAsteroidsShot || 0; // Number of asteroids space ship has destroyed
	this.spawnTime      = Date.now();              // Time of spawn
	this.isImmune       = true;                    // If space ship can't be damaged
	this.hue            = startHue || 0;           // Hue of color of space ship
	this.opacity        = 1;                       // Opacity of space ship
	this.isAccelerating = false;                   // If the space ship is accelerating
	this.limbo          = false;                   // Is true when player is dead and client is waiting on server to broadcast respawned player's new position
	
	// Make immune during spawn for set immuneTime
	this.makeImmune();
}

SpaceShip.prototype = new SpaceObject();
SpaceShip.prototype.constructor = SpaceShip;

/***********************
** CONSTANTS
************************/
SpaceShip.prototype.width           = 15;          // Width of the space ship (px)
SpaceShip.prototype.height          = 25;          // Height of the space ship (px)
SpaceShip.prototype.absAcceleration = 150;         // The space ship's acceleration on gas as scalar (px/s^2)
SpaceShip.prototype.rotationSpeed   = 3*Math.PI/2; // The speed of the space ship rotation when rotating (rad/s)
SpaceShip.prototype.shotsDelay      = 200;         // Time that has to pass before another bullet can be shot (ms)
SpaceShip.prototype.damping         = 0.4;         // The constant damping due to (what?) wind resistance (talk about dark forces)
SpaceShip.prototype.immuneTime      = 3000;        // Time space ship is immune on spawn and after kill (ms)

/***********************
** METHODS
************************/
/**
 * Make the object accelerate in the direction of its rotation
 */
SpaceShip.prototype.accelerate = function (td, absAcceleration) {
	var absAcceleration = absAcceleration || this.absAcceleration,
			ax = absAcceleration * Math.cos(this.rotation),
			ay = absAcceleration * Math.sin(this.rotation),
			acceleration = new Vector(ax, ay);
	
	// v = v1 + v2; a * t = v => v = v1 + a * t
	this.velocity.iAddVector(acceleration.mulScalar(td));
};

/**
 * Shoot a bullet
 */
SpaceShip.prototype.shoot = function () {
	var now, x, y, vx, vy, velocity;
	
	// Only shoot bullet if at least shotsDelay has passed since lastShot
	now = Date.now();
	if (now - this.lastShot > this.shotsDelay) {
		// Determine start coordinates for new bullet
		x = this.position.x + this.height/2 * Math.cos(this.rotation);
		y = this.position.y + this.height/2 * Math.sin(this.rotation);
		
		// Determine start velocity for bullet
		vx = Bullet.prototype.speed * Math.cos(this.rotation);
		vy = Bullet.prototype.speed * Math.sin(this.rotation);
		velocity = new Vector(vx, vy);
		
		// Shoot bullet by adding a new Bullet object to bullets array
		this.bullets.push(new Bullet(x, y, velocity));
		
		// Last bullet was shot now
		this.lastShot = now;
		
		// Total number of bullet shot has increased by 1
		this.bulletsShot++;
	}
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
 * Make the space ship blink
 */
SpaceShip.prototype.blink = function () {
	var _this = this,
			toggleOpacity = 0.1,
			blinkId = setInterval(function () {
				if (_this.opacity === toggleOpacity) {
					_this.opacity = 1;
				} else {
					_this.opacity = toggleOpacity;
				}
			}, 200);
			
	return blinkId;
};

/**
 * Make space ship immune for a given time
 */
SpaceShip.prototype.makeImmune = function (time) {
	var time = time || this.immuneTime, // Time the immunity lasts
			_this = this;
	
	// Stop current animation if one is running (if player was immune during end of last round e.g.)
	if (this.isImmune) {
		clearTimeout(this.immuneId);
		clearInterval(this.blinkId);
	}
	
	this.blinkId = this.blink(); // Start blinking animation
	this.isImmune = true;        // Make the space ship immune
	
	// After given time
	this.immuneId = setTimeout(function () {
		// Unset immunity
		_this.isImmune = false;
		// Cancel blinking animation
		clearInterval(_this.blinkId);
		// Make sure space ship isn't transparent
		_this.opacity = 1;
	}, time);
};

/**
 * Return an object with data of a new player to be transmitted to a socket server
 */
SpaceShip.prototype.getNewPlayerData = function () {
	return {
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
 * Return an object with data of a player relevant on moving
 */
SpaceShip.prototype.getMovePlayerData = function () {
	return {
		x:              this.position.x,
		y:              this.position.y,
		rotation:       this.rotation,
		isAccelerating: this.isAccelerating
	};
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

/**
 * ..---=====| UPDATE |=====---..
 *
 * Update space ship properties every td
 */
SpaceShip.prototype.update = function (td, keys) {		
	// Press FORWARD - accelerate
	if (keys.isKeydown(keys.FORWARD)) {
		// Make the space ship accelerate
		this.accelerate(td);
		// Space ship is accelerating
		this.isAccelerating = true;
	}
	else {
		// Space ship is not accelerating
		this.isAccelerating = false;
	}
	
	// Press LEFT  - rotate counter clock wise (Left arrow takes priority over right)
	if (keys.isKeydown(keys.LEFT)) { this.rotate(td, -this.rotationSpeed); }
	// Press RIGHT - rotate clock wise
	else if (keys.isKeydown(keys.RIGHT)) { this.rotate(td, this.rotationSpeed); }
	
	// Press SHOOT - shoot a bullet (Player can not shoot if it is immune)
	if (keys.isKeydown(keys.SHOOT) && !this.isImmune) {
		this.shoot();
	}
	
	// Update position
	this.move(td);
	
	// Exert damping
	this.velocity.iMulScalar(1 / (1 + this.damping*td));
};

/**
 * ..---=====| DRAW |=====---..
 *
 * Draw the space ship on canvas
 */
SpaceShip.prototype.draw = function (ctx, canvasOffset) {
	var _this = this;
	
	// Save rendering context
	ctx.save();
	
	// Translate coordinates on rendering context in accordance with offset
	ctx.translate(this.position.x - canvasOffset.x, this.position.y - canvasOffset.y);
	
	// Draw the health bar with player's alias above it on canvas
	drawHealthBarAndAlias();
	
	// Draw the spaceship on the canvas
	drawSpaceShip();

	// Restore rendering context
	ctx.restore();
	
	/**
	 * Draw health bar and type alias
	 */
	function drawHealthBarAndAlias() {
		var hbWidth = 50,  // Width of health bar
				hbHeight = 5,  // Height of health bar
				hbPadding = 2, // Space between health bar fill and border
				hbOuterWidth = hbWidth + hbPadding*2,
				hbOuterHeight = hbHeight + hbPadding*2,
				hue = 90/100*_this.health, // Hue of health bar color
				hbGradient = ctx.createLinearGradient(-hbWidth/2, -(_this.height + hbHeight), -hbWidth/2, -_this.height); // Gradient effect

		// Set gradient color stops
		hbGradient.addColorStop(0, "hsla(" + hue + ", 100%, 75%, 0.8)");
		hbGradient.addColorStop(0.5, "hsla(" + hue + ", 100%, 50%, 0.8)");
		hbGradient.addColorStop(1, "hsla(" + hue + ", 100%, 35%, 0.8)");
		
		// Draw health bar
		ctx.fillStyle = hbGradient;
		ctx.fillRect(-hbWidth/2, -(_this.height + hbHeight), hbWidth/100*_this.health, hbHeight);
		ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
		ctx.strokeRect(-hbOuterWidth/2, -(_this.height + hbHeight + hbPadding), hbOuterWidth, hbOuterHeight);
		
		// Type alias
		ctx.font = "10px verdana";
		ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
		ctx.fillText(_this.alias, -hbOuterWidth/2, -(_this.height + hbHeight + hbPadding + 5));
	}
	
	/**
	 * Draw the actual space ship
	 */
	function drawSpaceShip() {
		var spaceShipGradient, r;
		// Rotate rendering context along with rotation of space ship
		ctx.rotate(_this.rotation);
		
		// Set fill style (gradient)
		r = Math.min(_this.width, _this.height);
		spaceShipGradient = ctx.createRadialGradient(-r/3, 0, r/12, 0, 0, r);		
		spaceShipGradient.addColorStop(0, "hsla(" + _this.hue + ", 100%, 55%, " + _this.opacity + ")");
		spaceShipGradient.addColorStop(0.8, "hsla(" + _this.hue + ", 100%, 30%, " + _this.opacity + ")");		
		ctx.fillStyle = spaceShipGradient;
		
		// Draw space ship body fill
		ctx.beginPath();
		ctx.moveTo(_this.height/2, 0);
		ctx.lineTo(-_this.height/2, _this.width/2);
		ctx.lineTo(-_this.height/2, -_this.width/2);
		ctx.closePath();
		ctx.fill();
		
		// Set stroke style
		ctx.strokeStyle = "rgba(255, 255, 255, " + _this.opacity + ")";
		
		// Draw stroke with bottom "spoilers"
		ctx.beginPath();
		ctx.moveTo(_this.height/2, 0);
		ctx.lineTo(-3*_this.height/4, 2*_this.width/3);
		ctx.moveTo(-_this.height/2, _this.width/2);
		ctx.lineTo(-_this.height/2, -_this.width/2);
		ctx.moveTo(_this.height/2, 0);
		ctx.lineTo(-3*_this.height/4, -2*_this.width/3);
		ctx.closePath();
		ctx.stroke();
	}
};

window.SpaceShip = SpaceShip;