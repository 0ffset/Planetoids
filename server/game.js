/**
 * MULTIPLAYER ASTEROIDS GAME SOCKET.IO SERVER
 */

/**
 * Require essential modules
 */
var util        = require("util"),
    io          = require("socket.io"),
		SpaceObject = require("./classes/SpaceObject").SpaceObject, // Generic class for all space objects
		Asteroid    = require("./classes/Asteroid").Asteroid,       // Class for asteroids
		SpaceShip   = require("./classes/SpaceShip").SpaceShip,     // Class for space ships (players)
		Bullet      = require("./classes/Bullet").Bullet;           // Class for bullets

/**
 * Server variables
 */
var socket,          // The socket that communicates with all connected clients
		asteroids,       // All asteroids within game arena
    players,         // All connected players
		startTime,       // Time when round started
		asteroidsLoopId; // Id of asteroids loop interval
		
/**
 * Server constants
 */
var port         = 8021,                  // The port the socket should be listening on
		areaWidth    = 3000,                  // Width of game area (px)
		areaHeight   = 2250,                  // Height of game area (px)
		countDown    = 3000,                  // Count down time to each round (ms)
		roundTime    = 2*60*1000 + countDown, // Time one round lasts (ms)
		pingInterval = 2000,                  // Interval between ping measurements
		numAsteroids = 50;                    // Number of asteroids present at start

/**
 * Initialization function
 */
function init() {		
	// Configure socket
	socket = io.listen(port);
	socket.configure(function () {
		socket.set("transports", ["websocket"]);
		socket.set("log level", 2);
	});
	
	// Keep all connected players in an array
	players = [];
	
	// Set the event handlers
	setEventHandlers();
	
	// Start first round and the round loop
	startRound();
	setInterval(startRound, roundTime);
}

/**
 * Initialize asteroids
 */
function initAsteroids() {
	var i, x, y, rotation, velocity, rotationSpeed, diameter, newAsteroid;
	
	// Keep all asteroids in an array
	asteroids = [];
	
	// Create the asteroids
	for (i = 0; i < numAsteroids; i++) {		
		// Create a new Asteroid instance (and make asteroid spawn inside game area)
		newAsteroid = returnNewAsteroid();
		x = random(0, areaWidth);
		y = random(0, areaHeight);
		newAsteroid.x = x;
		newAsteroid.spawnX = x;
		newAsteroid.y = y;
		newAsteroid.spawnY = y;
		newAsteroid.index = i;
		
		// Add new asteroid to asteroids array
		asteroids.push(newAsteroid);
		
		// Send new asteroid to clients
		socket.sockets.emit("new asteroid", newAsteroid.getNewAsteroidData());
	}
	
	// Start the asteroids update loop (if it's not already running)
	if (typeof asteroidsLoopId === "undefined") {
		asteroidsUpdateLoop();
	}
}

/**
 * Start a new round
 */
function startRound() {
	var i, player, score, winner;
	
	// Set start time
	startTime = Date.now();
	
	// Reset all player statistics and bullets, and store winner of last round
	winner = {playerId: 0, score: "NaN"};
	for (i = 0; i < players.length; i++) {
		player = players[i];
		score = player.score();
		
		// Store winner in object
		if (score > winner.score || winner.score === "NaN") {
			winner.playerId = player.id;
			winner.score = score;
		}
		
		// Reset player statistics and bullets
		player.resetStats();
		player.bullets = [];
	}
	
	// Emit new round to players
	socket.sockets.emit("new round", {timeLeft: timeLeft(), winner: winner, reset: true});
	
	// Initialize asteroids
	initAsteroids();
}

/**
 * Event handlers
 */
function setEventHandlers () {
	socket.sockets.on("connection", onSocketConnection);
}

// Socket connection
function onSocketConnection(client) {
	util.log("New player has connected: " + client.id);
	client.on("ping", onPing);
	client.on("pong", onPong);
	client.on("disconnect", onClientDisconnect);
	client.on("new player", onNewPlayer);
	client.on("move player", onMovePlayer);
	client.on("respawn player", onRespawnPlayer);
	client.on("players collide", onPlayersCollide);
	client.on("player message", onPlayerMessage);
	client.on("new bullet", onNewBullet);
	client.on("remove bullet", onRemoveBullet);
	client.on("bullet hit player", onBulletHitPlayer);
	client.on("bullet hit asteroid", onBulletHitAsteroid);
	client.on("asteroid hit player", onAsteroidHitPlayer);
}

// Client ping emit
function onPing() {
	this.emit("pong");
}

// Client pong emit
function onPong() {
	var player = playerById(this.id),
			ping = Date.now() - player.pingStart;
	
	player.pingArray.push(ping);
	if (player.pingArray.length > 5) {
		player.pingArray.splice(0, 1);
	}
}

// Client disconnect
function onClientDisconnect() {
	var removePlayer = playerById(this.id);
	
	// Log that player has disconnected
	util.log("Player has disconnected: " + this.id);

	if (!removePlayer) {
			//util.log("Player not found: " + this.id);
			return;
	}
	
	// Stop disconnected player's ping loop
	clearInterval(removePlayer.pingLoopId);

	// Remove player from players array
	players.splice(players.indexOf(removePlayer), 1);
	
	// Broadcast to all other player that the player has disconnected
	this.broadcast.emit("remove player", {id: this.id});
	
	// Log how many players are currently connected
	util.log(players.length + " players currently connected");
}

// New player
function onNewPlayer(data) {
	var i, j, newPlayer, existingAsteroid, existingPlayer, existingPlayerData, existingBullet;
	
	// Create new SpaceShip instance
	newPlayer = new SpaceShip(data.x, data.y, data.rotation, data.health, data.hue);
	
	// Set player identifiers
	newPlayer.id = this.id;
	newPlayer.alias = data.alias;
	
	// Emit new player to all existing players
	this.broadcast.emit("new player", newPlayer.getNewPlayerData());
	
	// Emit new round to new player
	this.emit("new round", {timeLeft: timeLeft(), reset: false});
	
	// Emit existing asteroids to new player
	for (i = 0; i < asteroids.length; i++) {
		existingAsteroid = asteroids[i];
		this.emit("new asteroid", existingAsteroid.getNewAsteroidData());
	}
	
	// Emit existing players and their bullets to new player
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		// Emit existing player
		existingPlayerData = existingPlayer.getNewPlayerData();
		existingPlayerData.wasAlreadyPlaying = true;
		this.emit("new player", existingPlayerData);		
		// Emit existing bullets
		for (j = 0; j < existingPlayer.bullets.length; j++) {
			existingBullet = existingPlayer.bullets[j];
			this.emit("new bullet", {
				playerId: existingPlayer.id,
				index:    j,
				x:        existingBullet.x,
				y:        existingBullet.y
			});
		}
	}
	
	// Add new player to players array
	players.push(newPlayer);
	
	// Start player ping loop
	newPlayer.pingStart = Date.now();
	this.emit("ping", {ping: newPlayer.getPing()});
	var _this = this;
	newPlayer.pingLoopId = setInterval(function () {
		newPlayer.pingStart = Date.now();
		_this.emit("ping", {ping: newPlayer.getPing()});
	}, pingInterval);
	
	// Log how many players are currently connected
	util.log(players.length + " players currently connected");
}

// Move player
function onMovePlayer(data) {
	var movePlayer = playerById(this.id);

	if (!movePlayer) {
		//util.log("Player not found: " + this.id);
		return;
	}

	// Update player properties
	movePlayer.x        = data.x;
	movePlayer.y        = data.y;
	movePlayer.rotation = data.rotation;
	
	// Check if the player collided with another player
	var i, otherPlayer, distance;
	for (i = 0; i < players.length; i++) {
		otherPlayer = players[i];
		if (movePlayer.id != otherPlayer.id) {
			distance = distanceTo(movePlayer.x, movePlayer.y, otherPlayer.x, otherPlayer.y);
			if (distance <= movePlayer.height/2) {
				socket.sockets.emit("players collide", {playerId1: movePlayer.id, playerId2: otherPlayer.id});
			}
		}
	}

	// Broadcast player's new properties to the other players
	this.broadcast.emit("move player", {
		id:             movePlayer.id,
		x:              movePlayer.x,
		y:              movePlayer.y,
		rotation:       movePlayer.rotation,
		isAccelerating: data.isAccelerating
	});
}

// Respawn player
function onRespawnPlayer() {
	this.broadcast.emit("respawn player", {playerId: this.id});
}

// Player collided with another player (both clients will emit this event)
function onPlayersCollide(data) {
	var player = playerById(data.playerId);
	
	// Add 1 to death stats
	player.deaths++;
}

// Player sent message
function onPlayerMessage(data) {
	socket.sockets.emit("player message", {
		playerId: this.id,
		message: data.message
	});
}

// New bullet
function onNewBullet(data) {
	var latency, spawnTime, newBullet, playerWhoShot;

	playerWhoShot = playerById(this.id);
	
	if (!playerWhoShot) {
		return;
	}
	
	// Calculate when bullet was fired
	latency = playerWhoShot.getPing() / 2;
	spawnTime = Date.now() - (data.timeExisted + latency);
	
	// Create new bullet
	newBullet = new Bullet(data.spawnX, data.spawnY, data.velocity, spawnTime);
	
	// Emit new bullet to all existing players
	this.broadcast.emit("new bullet", {
		playerId:    playerWhoShot.id,
		index:       data.index,
		spawnX:      newBullet.spawnX,
		spawnY:      newBullet.spawnY,
		velocity:    newBullet.velocity,
		timeExisted: Date.now() - newBullet.spawnTime
	});
	
	// Add new bullet to bullets array of player who shot
	playerWhoShot.bullets[data.index] = newBullet;
}

// Bullet hit player
function onBulletHitPlayer(data) {
	var hitPlayer = playerById(data.id),     // Player who got hit by a bullet
			playerWhoShot = playerById(this.id); // Player who shot
	
	if (!hitPlayer || !playerWhoShot) {
		return;
	}
	
	hitPlayer.health -= Bullet.prototype.damage;
	
	if (hitPlayer.health <= 0) {
		hitPlayer.deaths++;
		hitPlayer.health = 100;
		playerWhoShot.kills++;
	}
	
	this.broadcast.emit("bullet hit player", {
		playerWhoShot: playerWhoShot.id,
		hitPlayer: hitPlayer.id
	});
}

// Remove bullet
function onRemoveBullet(data) {
	var playerWhoShot = playerById(this.id);
	
	if (!playerWhoShot) {
		return;
	}
	
	// Remove bullet from bullets array of player who shot
	playerWhoShot.bullets.splice(data.index, 1);
	
	// Broadcast to all other players that this bullet is removed
	this.broadcast.emit("remove bullet", {playerId: playerWhoShot.id, index: data.index});
}

// Bullet hit asteroid
function onBulletHitAsteroid(data) {
	var newAsteroid, playerWhoShot;
	
	playerWhoShot = playerById(this.id);
	
	if (!playerWhoShot) {
		return;
	}
	
	playerWhoShot.asteroidsShot++;
	
	// Emit that player shot asteroid
	this.broadcast.emit("bullet hit asteroid", {playerId: this.id, asteroidIndex: data.index});
	
	newAsteroid = returnNewAsteroid();
	newAsteroid.index = data.index;
	
	asteroids[data.index] = newAsteroid;
	
	// Emit the new asteroid
	socket.sockets.emit("new asteroid", newAsteroid.getNewAsteroidData());
}

// Asteroid hit player
function onAsteroidHitPlayer(data) {
	var newAsteroid, hitPlayer;
	
	hitPlayer = playerById(this.id);
	
	if (!hitPlayer) {
		return;
	}
	
	hitPlayer.deaths++;
	
	// Emit that asteroid hit player
	this.broadcast.emit("asteroid hit player", {playerId: this.id});
	
	newAsteroid = returnNewAsteroid();
	newAsteroid.index = data.asteroidIndex;
	
	asteroids[data.asteroidIndex] = newAsteroid;
	
	// Emit the new asteroid
	socket.sockets.emit("new asteroid", newAsteroid.getNewAsteroidData());	
}

/**
 * Asteroids update loop
 */
function asteroidsUpdateLoop() {
	var td, i, asteroid, updateRate;
			
	updateRate = Asteroid.prototype.updateRate; // How often asteroid's properties should be updated
	td = updateRate / 1000;                     // Time difference since last update (s)
	
	// Update properties of all asteroids
	asteroidsLoopId = setInterval(function () {
		for (i = 0; i < asteroids.length; i++) {
			// Update properties
			asteroids[i].x        += asteroids[i].velocity.x * td;
			asteroids[i].y        += asteroids[i].velocity.y * td;
			
			// If asteroid is outside game area
			if (asteroids[i].isOutsideGameArea(areaWidth, areaHeight)) {
				// Replace asteroid with a new one
				asteroids[i] = returnNewAsteroid();
				asteroids[i].index = i;
				// Emit the new asteroid
				socket.sockets.emit("new asteroid", asteroids[i].getNewAsteroidData());
			}
		}
	}, updateRate);
}

/**
 * Helper functions
 */
// Get a random number
function random(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get player by id
function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	}

	return false;
}

// Calculate time left
function timeLeft() {
	var now = Date.now();
	return roundTime - (now - startTime);
}

// Calculate distance between two points
function distanceTo(x1, y1, x2, y2) {
	var dx, dy, distance;
	
	dx = x1 - x2;
	dy = y1 - y2;
	distance = Math.sqrt(dx*dx + dy*dy);
	
	return distance;
}

// Generate new asteroids with random properties just right outside of visible game area
function returnNewAsteroid() {
	var opt, maxSpeed, x, y, rotation, velocity, rotationSpeed, diameter, newAsteroid;
	
	rotation      = random(0, 360) * Math.PI/180;         // Rotation of asteroid
	rotationSpeed = (random(0, 360) - 180) * Math.PI/180; // Rotation speed of asteroid
	diameter      = random(50, 120);                      // Diameter of asteroid
	
	maxSpeed = 200; // Max speed of asteroid in x or y direction
	
	opt = random(1, 4); // Determines which direction asteroid will appear from
	
	switch (opt) {
		case 1: // Asteroid will appear from top
			x = random(0, areaWidth);
			y = -diameter/2;
			velocity = {
				x: random(0, maxSpeed*2) - maxSpeed,
				y: random(0, maxSpeed)
			};
			break;
		case 2: // Asteroid will appear from right
			x = areaWidth + diameter/2;
			y = random(0, areaHeight);
			velocity = {
				x: random(0, maxSpeed) - maxSpeed,
				y: random(0, maxSpeed*2) - maxSpeed
			};
			break;
		case 3: // Asteroid will appear from bottom
			x = random(0, areaWidth);
			y = areaHeight + diameter/2;
			velocity = {
				x: random(0, maxSpeed*2) - maxSpeed,
				y: random(0, maxSpeed) - maxSpeed
			};			
			break;
		case 4: // Asteroid will appear from left
			x = -diameter/2;
			y = random(0, areaHeight);
			velocity = {
				x: random(0, maxSpeed),
				y: random(0, maxSpeed*2) - maxSpeed
			};
			break;
		default:
	}
	
	newAsteroid = new Asteroid(x, y, rotation, velocity, rotationSpeed, diameter);
	
	return newAsteroid;
}

/**
 * INITIALIZE GAME
 */
init();