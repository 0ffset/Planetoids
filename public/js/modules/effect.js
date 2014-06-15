/**
 * Visual effect functions
 */
var effect = {};

/**
 * Draw smoke (smoke is an array of SmokeBubbles)
 */
// Draw the smoke
effect.drawSmoke = function (ctx, smoke, canvasOffset, hue) {
	var i, smokeBubble;
	for (i = 0; i < smoke.length; i++) {
		smokeBubble = smoke[i];
		smokeBubble.draw(ctx, canvasOffset, hue);
	}
};

// Update the smoke
effect.updateSmoke = function (td, smoke) {
	var i, smokeBubble;
	for (i = 0; i < smoke.length; i++) {
		smokeBubble = smoke[i];
		smokeBubble.update(td);
		// Remove SmokeBubble if it has faded away
		if (smokeBubble.opacity <= 0.01) {
			smoke.splice(i, 1);
		}
	}
	
	return smoke;
};

// Return new SmokeBubble behind SpaceShip on acceleration
effect.getSmokeBehindSpaceShip = function (spaceShip) {
	var margin = 6, // Space between space ship end and SmokeBubble (px)
			x        = spaceShip.position.x - (spaceShip.height/2 + margin) * Math.cos(spaceShip.rotation),
			y        = spaceShip.position.y - (spaceShip.height/2 + margin) * Math.sin(spaceShip.rotation),
			hue      = spaceShip.hue,
			speed    = -40,
			velocity = new Vector(speed * Math.cos(spaceShip.rotation), speed * Math.sin(spaceShip.rotation));
	
	return new SmokeBubble(x, y, hue, velocity);
};

// Return smoke array with added explosion as an array of SmokeBubbles
effect.addExplosion = function (position, smoke) {
	var i,
			n = 60,         // Number of SmokeBubbles making up the explosion effect
			x = position.x, // X coordinate of explosion
			y = position.y, // Y coordinate of explosion
			smokeBubble,    // A SmokeBubble object
			
			// Properties of the SmokeBubble object
			vx, vy, velocity,
			radius,
			maxRadius = 40, // Actually max radius times 10 (see radius in for loop)
			minRadius = 1,  // Actually min radius times 10 (see radius in for loop)
			maxSpeed  = 100,
			direction;
	
	// Create n SmokeBubbles
	for (i = 0; i < n; i++) {
		// Set a random radius
		radius = (Math.floor(Math.random() * (maxRadius - minRadius + 1)) + minRadius)/10;
		// Set a random direction
		direction = (Math.floor(Math.random() * (360 - 0 + 1)) + 0) * Math.PI/180;
		// Set a velocity in relation to the radius (the bigger the radius, the slower the velocity)
		vx = maxSpeed/radius*Math.cos(direction);
		vy = maxSpeed/radius*Math.sin(direction);
		velocity = new Vector(vx, vy);
		// Create new SmokeBubble instance and add it to smoke array
		smokeBubble = new SmokeBubble(x, y, 45, velocity, radius);
		smoke.push(smokeBubble);
	}
	
	// Return smoke array with added explosion
	return smoke;
}

window.effect = effect;