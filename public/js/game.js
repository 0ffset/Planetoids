/**
 * MULTIPLAYER ASTEROIDS GAME CLIENT
 */

/**
 * Game variables
 */
var canvas,          // Canvas DOM element
		ctx,             // Canvas rendering context
		keys,            // Keyboard input
		localPlayer,     // Local player
		remotePlayers,   // Remote players
		asteroids,       // Asteroids
		smoke,           // Smoke effects
		socket,          // Socket for communication with Socket.IO server
		animationId,     // Animation frame id
		fps,             // Animation frames per second
		ping,            // Ping (ms)
		pingStart,       // Start time of ping measurement
		startTime,       // Start time of current round
		lastGameTick,    // Time when the animation frame was updated last time
		lastBulletsShot; // Number of bullets local player had shot in total last time checked

/**
 * Game constants
 */
var host         = "http://localhost",    // Socket.io server host
		port         = 8021,                  // Socket.io server port
		countDown    = 3000,                  // Count down time to each round (ms)
		roundTime    = 2*60*1000 + countDown, // Time one round lasts (ms)
		area         = {                      // The game area
			width:  3000,
			height: 2250
		};

/**
 * Game initialization
 */
function init(alias) {
	// Define the canvas and rendering context
	canvas = document.getElementById("game-canvas");
	ctx = canvas.getContext("2d");

	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	// Initialize essential modules
	sound.init();   // sounds (see sound.js)
	texture.init(); // textures (see texture.js)
	log.init();     // log (see log.js)
	stats.init();   // modal window for statistics (see stats.js)
	
	// Keep all asteroids in an array
	asteroids = [];
	
	// Keep all running smoke effects in an array
	smoke = [];

	// Initialize keyboard controls
	keys = new Keys();

	// Initialize the local player and set start values
	localPlayer = new SpaceShip();
	localPlayer.alias = alias;
	localPlayer.hue = random(0, 255);
	setLocalPlayerStartProperties();
	
	// Set last time a bullet was shot by local player to zero
	lastBulletsShot = 0;
			
	// Set canvas background and define canvas offsets
	canvas.offset = {
		x: 0,
		y: 0
	};
	
	// Connect to Socket.io server
	socket = io.connect(host, {port: port, transports: ["websocket"]});
	
	// Keep all remote players in an array
	remotePlayers = [];

	// Start listening for events
	setEventHandlers();
};

/**
 * Game event handlers
 */
function setEventHandlers() {
	// Keyboard
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);
	
	// Mouse move
	window.addEventListener("mousemove", onMousemove, false);

	// Window resize
	window.addEventListener("resize", onResize, false);
	
	// Socket.IO server events
	socket.on("connect", onSocketConnected);
	socket.on("disconnect", onSocketDisconnect);
	socket.on("ping", onPing);
	socket.on("pong", onPong);
	socket.on("new round", onNewRound);
	socket.on("new asteroid", onNewAsteroid);
	socket.on("new player", onNewPlayer);
	socket.on("move player", onMovePlayer);
	socket.on("respawn player", onRespawnPlayer);
	socket.on("players collide", onPlayersCollide);
	socket.on("player message", onPlayerMessage);
	socket.on("remove player", onRemovePlayer);
	socket.on("new bullet", onNewBullet);
	socket.on("remove bullet", onRemoveBullet);
	socket.on("bullet hit player", onBulletHitPlayer);
	socket.on("bullet hit asteroid", onBulletHitAsteroid);
	socket.on("asteroid hit player", onAsteroidHitPlayer);
}

// Keyboard key down
function onKeydown(e) {
	// Only respond as usual to key press if message container is invisible
	if (!log.msgVisible) {
		/**
		 * On press TAB
		 */
		if (e.keyCode === keys.TAB) {
			// Prevent from flipping between focused elements on press TAB
			e.preventDefault();
			// Make stats visible if it isn't already
			if (!keys.isKeydown(keys.TAB)) {
				stats.show();
			}
		}
		/**
		 * On press MESSAGE
		 */
		else if (e.keyCode === keys.MESSAGE) {
			log.showMsg();
		}
		/** 
		 * On press MUTE
		 */
		else if (e.keyCode === keys.MUTE && !keys.isKeydown(keys.MUTE)) {
			sound.muteToggle();
		}
		
		// Provide keys object with the event
		keys.onKeydown(e);
	}
	// Else, if message container is visible
	else {
		/**
		 * On press MESSAGE
		 */
		if (e.keyCode === keys.MESSAGE && !keys.isKeydown(keys.MESSAGE)) {
			var message = log.msgVal();
			// Only post message if not empty
			if (message !== "") {
				socket.emit("player message", {message: message});
			}
			// Hide message container
			log.hideMsg();
		}
	}
}

// Keyboard key up
function onKeyup(e) {
	/**
	 * On release TAB
	 */
	if (e.keyCode === keys.TAB) {
		stats.hide();
	}
	
	// Provide keys object with the event
	keys.onKeyup(e);
}

// Mouse move
var hideMouseId;
function onMousemove(e) {
	var timeout = 2000, // Time until cursor gets hided
			target = document.body;
	
	// Set cursor to default
	target.style.cursor = "default";
	
	// Clear ongoing timeout if any
	if (hideMouseId) clearTimeout(hideMouseId);
	
	// Start timeout for hiding cursor
	hideMouseId = setTimeout(function () {
		target.style.cursor = "none";
	}, timeout);
}

// Browser window resize
function onResize(e) {
	// Maximize the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	// Resize log
	log.resize();
	
	// Resize modal window for statistics
	stats.resize();
}

// Socket connected
function onSocketConnected() {
	console.log("Connected to socket server");
	
	// Hide loader
	$("#loader").fadeOut(100);
	
	// Start the animation
	animate();
	
	// Emit ping
	pingStart = Date.now();
	socket.emit("ping");
	
	// Emit new player
	socket.emit("new player", localPlayer.getNewPlayerData());
	
	// Set local player id to socket session id
	localPlayer.id = socket.socket.sessionid;
	console.log("localPlayer.id: " + localPlayer.id);
	
	// Create DOM-element for the local player's stats
	stats.addPlayer(localPlayer, "local-player");
	
	// Print message in log
	log.print("You are now connected!");
}

// Socket disconnect
function onSocketDisconnect() {
	// Print message in log
	log.print("<span style='color:#f00'>You got disconnected from the server.</span>");
	
	// Stop the animation
	cancelAnimationFrame(animationId);
	
	// Empty remote players array
	remotePlayers = [];
	
	// Remove all players from statistics table
	stats.removeAll();
	
	// Reset local player stats
	localPlayer.resetStats();
}

// New round
function onNewRound(data) {
	var i, remotePlayer, winner, score;
	
	// Set start time of round
	startTime = Date.now() - (roundTime - data.timeLeft);
	
	// Do not reset round if player connected to already ongoing round
	if (data.reset) {
		// Empty asteroids array
		asteroids = [];
		
		// Make local player immune
		localPlayer.makeImmune();
		
		// Store winner data
		winner = data.winner.playerId === localPlayer.id ? localPlayer : playerById(data.winner.playerId);
		score  = data.winner.score;
		
		// Reset remote players statistics and bullets
		for (i = 0; i < remotePlayers.length; i++) {
			remotePlayer = remotePlayers[i];
			remotePlayer.resetStats();
			remotePlayer.bullets = [];
		}
		
		// Reset local player statistics and bullets, and set start properties
		localPlayer.resetStats();
		localPlayer.bullets = [];
		setLocalPlayerStartProperties();
		
		// Show new round modal
		stats.showNewRoundModal(winner, score);
		
		// Reset statistics table
		stats.reset();
		
		// Print last rounds winner in log
		log.print(aliasTag(winner) + " won last round with a score of " + score + "!");
	}
}

// On ping
function onPing(data) {
	socket.emit("pong");
	ping = data.ping;
	if (ping) {
		// Print the ping (and fps at the same time)
		printPingFps();
	}
}

// On pong (ping is sent by client ONLY on connection, the rest of the time it is calculated by the server)
function onPong() {
	ping = Date.now() - pingStart;
	
	// Print the ping (and fps at the same time)
	printPingFps();
}

// New asteroid was generated by server
function onNewAsteroid(data) {
	var x, y, position, rotation, velocity, timeExisted, latency;
	
	// Calculate for how long the asteroid has already existed
	latency = ping / 2;
	timeExisted = (data.timeExisted + latency) / 1000;
	
	// Convert data.velocity to a vector
	velocity = new Vector(data.velocity.x, data.velocity.y);
	
	// Calculate the current position of asteroid
	position = new Vector(data.spawnX, data.spawnY);
	position.iAddVector(velocity.mulScalar(timeExisted));
	
	// Calculate current rotation of asteroid
	rotation = data.rotation + data.rotationSpeed * timeExisted;
	
	// Instantiate new Asteroid object
	newAsteroid = new Asteroid(position.x, position.y, rotation, velocity, data.diameter, data.rotationSpeed);
	
	// Add new asteroid to asteroids array
	asteroids[data.index] = newAsteroid;
	asteroids[data.index].index = data.index;
}

// New player connected
function onNewPlayer(data) {
	// Create new SpaceShip instance
	var newPlayer = new SpaceShip(data.x, data.y, data.rotation, data.health, data.kills, data.deaths, data.asteroidsShot, data.hue);
	
	// Set player identifiers
	newPlayer.id = data.id;
	newPlayer.alias = data.alias;
	
	// Add new player to remotePlayers
	remotePlayers.push(newPlayer);
	
	// Add new player to stats modal
	stats.addPlayer(newPlayer);
	
	// Print message in log
	if (!data.wasAlreadyPlaying) {
		log.print(aliasTag(newPlayer) + " joined the game!");
	}
}

// Remote player moved
function onMovePlayer(data) {
	var movePlayer = playerById(data.id);

	// Don't do anything if player can't be found or is in limbo state
	if (!movePlayer || movePlayer.limbo) return;

	// Update moved player's properties
	movePlayer.position.x     = data.x;
	movePlayer.position.y     = data.y;
	movePlayer.rotation       = data.rotation;
	movePlayer.isAccelerating = data.isAccelerating;
}

// Killed player re-spawn
function onRespawnPlayer(data) {
	var respawnPlayer = playerById(data.playerId);
	
	// Make sure re-spawned player isn't in limbo state
	respawnPlayer.limbo = false;
}

// Two players collide
function onPlayersCollide(data) {
	var i, playerId, player, collidedPlayers;
	
	collidedPlayers = [];
	for (i = 1; i <= 2; i++) {
		playerId = data["playerId"+i];
		if (playerId === localPlayer.id) {
			player = localPlayer;
		}	else {
			player = playerById(playerId);
		}
		collidedPlayers.push(player);
		
		// Do nothing if anyone of the players is immune
		if (player.isImmune) return;
	}
	
	for (i = 0; i <= 1; i++) {
		player = collidedPlayers[i];
		updateAfterKill(player);
		if (player.id === localPlayer.id) {
			setLocalPlayerStartProperties();
			// Let server know local player died on collision
			socket.emit("players collide", {playerId: localPlayer.id});
		}
	}
	
	// Print to log that the players collided
	log.print(aliasTag(collidedPlayers[0]) + " and " + aliasTag(collidedPlayers[1]) + " collided!");
}

// Player message
function onPlayerMessage(data) {
	var player = data.playerId === localPlayer.id ? localPlayer : playerById(data.playerId);
	
	// Print message in log
	log.print(aliasTag(player) + " says: " + data.message);
}

// Remote player is removed
function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);

	// Don't do anything if player can't be found
	if (!removePlayer) return;

	// Remove player from remote players array
	remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
	
	// Remove player from stats modal
	stats.removePlayer(removePlayer);
	
	// Print message in log
	log.print(aliasTag(removePlayer) + " left the game.");
}

// Bullet hit player
function onBulletHitPlayer(data) {	
	var hitPlayer,     // Player who got hit by a bullet
			playerWhoShot; // Player who shot the bullet
			
	playerWhoShot = playerById(data.playerWhoShot);
	
	// If local player was hit
	if (data.hitPlayer == localPlayer.id) {
		hitPlayer = localPlayer;
	}
	// Else if another player was hit (and local player was not the one who shot)
	else {
		hitPlayer = playerById(data.hitPlayer);
	}
	
	// Decrement hit player health
	hitPlayer.health -= Bullet.prototype.damage;
	
	// If player died
	if (hitPlayer.health <= 0) {
		updateAfterKill(hitPlayer, playerWhoShot);
		
		// If local player died, set start properties
		if (hitPlayer.id == localPlayer.id) {
			setLocalPlayerStartProperties();
		}
	}
	// Else, play hit sound
	else {
		sound.hit.play(getVolume(hitPlayer.position));
	}
}

// Remote player shot a bullet
function onNewBullet(data) {
	var timeExisted, latency, position, velocity, newBullet, playerWhoShot;
	
	// Get remote player who shot the bullet
	playerWhoShot = playerById(data.playerId);

	// Don't do anything if player can't be found
	if (!playerWhoShot) return;
	
	// Calculate how long ago bullet was fired
	latency = ping / 2;
	timeExisted = (data.timeExisted + latency) / 1000;
	
	// Create velocity vector
	velocity = new Vector(data.velocity.x, data.velocity.y);
	
	// Calculate bullet's current position based on time existed and velocity
	position = new Vector(data.spawnX, data.spawnY);
	position.iAddVector(velocity.mulScalar(timeExisted));
	
	// Create new Bullet instance
	newBullet = new Bullet(position.x, position.y, velocity);
		
	// Play shoot sound
	sound.shoot.play(getVolume(newBullet.position));
	
	// Add bullet to remote player's bullet array
	playerWhoShot.bullets[data.index] = newBullet;
}

// Remove bullet shot by remote player
function onRemoveBullet(data) {
	var playerWhoShot = playerById(data.playerId);
	
	// Do nothing if player can't be found
	if (!playerWhoShot) return;
	
	// Remove bullet from bullet array of player who shot
	playerWhoShot.bullets.splice(data.index, 1);
}

// Remote player's bullet hit asteroid
function onBulletHitAsteroid(data) {
	var playerWhoShot = playerById(data.playerId),
			asteroid = asteroids[data.asteroidIndex];
			
	// Do nothing if player or asteroid can't be found
	if (!playerWhoShot || !asteroid) return;
	
	// Update stats
	playerWhoShot.asteroidsShot++;
	stats.update(playerWhoShot, "asteroidsShot");
	
	// Add explosion effects
	smoke = effect.addExplosion(asteroid.position, smoke);
	sound.hit.play(getVolume(asteroid.position));
}

// Asteroid hit player
function onAsteroidHitPlayer(data) {
	var hitPlayer = playerById(data.playerId);
	
	// Do nothing if player can't be found
	if (!hitPlayer) return;
	
	// Print in log
	log.print(aliasTag(hitPlayer) + " collided with an asteroid!");
	
	// Update hit player
	updateAfterKill(hitPlayer);
}

/**
 * Game animation loop
 */
function animate() {
	var now = Date.now(),
			td = (now - (lastGameTick || now)) / 1000; // Time difference since last frame (seconds)	

	// Set last game tick to now
	lastGameTick = now;
	
	// Update properties of all game objects
	update(td);	
	
	// Draw all game objects on canvas
	draw();

	// Request a new animation frame
	animationId = requestAnimationFrame(animate);
}


/**
 * Game update
 */
function update(td) {
	var i, j, newSmoke, asteroid, bulletsShot, index, newBullet, bullet, hitPlayer, hitAsteroid, remotePlayer;
	
	// Set value of frames per second
	fps = parseInt(1 / td, 10);
	
	// Update local player's properties
	localPlayer.update(td, keys);
	
	// Add smoke effect if local player is accelerating
	if (localPlayer.isAccelerating) {
		// Add smoke to global smoke array
		newSmoke = effect.getSmokeBehindSpaceShip(localPlayer);
		smoke.push(newSmoke);
	}
	
	// Check if local player collided with asteroid
	if (asteroid = asteroidHasHitLocalPlayer()) {
		// Emit that local player was hit by asteroid to server
		socket.emit("asteroid hit player", {asteroidIndex: asteroid.index});
		// Update local player properties
		updateAfterKill(localPlayer);
		setLocalPlayerStartProperties();
	}
	
	// Send updated properties to server
	socket.emit("move player", localPlayer.getMovePlayerData());
	
	// If bullet has been shot, emit new bullet to server
	bulletsShot = localPlayer.bulletsShot;
	if (bulletsShot > lastBulletsShot) {
		index     = localPlayer.bullets.length - 1;
		newBullet = localPlayer.bullets[index];
		
		// Play shoot sound
		sound.shoot.play();
		
		// Emit new bullet to server
		socket.emit("new bullet", {
			index:       index,
			spawnX:      newBullet.spawnX,
			spawnY:      newBullet.spawnY,
			velocity:    {x: newBullet.velocity.x, y: newBullet.velocity.y},
			timeExisted: (Date.now() - newBullet.spawnTime)
		});
	}
	lastBulletsShot = bulletsShot;
	
	// Update local player's bullets' positions
	for (i = 0; i < localPlayer.bullets.length ; i++) {
		bullet = localPlayer.bullets[i];
		bullet.update(td);
		
		// Check if bullet hit remote player
		if (hitPlayer = bulletHasHitRemotePlayer(bullet.position)) {
			// Play hit sound
			sound.hit.play(getVolume(hitPlayer.position));
			// Emit to server that local player hit someone
			socket.emit("bullet hit player", {id: hitPlayer.id});
			// Remove local bullet and emit to server that bullet has been removed
			removeLocalBulletAndEmitToServer(i);
		}
		// Check if bullet hit asteroid
		else if (hitAsteroid = bulletHasHitAsteroid(bullet.position)) {
			// Add explosion effects
			smoke = effect.addExplosion(hitAsteroid.position, smoke);
			sound.hit.play(getVolume(hitAsteroid.position));
			// Set asteroid in "limbo" state
			hitAsteroid.limbo = true;
			hitAsteroid.position = new Vector(-hitAsteroid.diameter, -hitAsteroid.diameter);
			// Update stats
			localPlayer.asteroidsShot++;
			stats.update(localPlayer, "asteroidsShot");
			// Emit to server that local player hit asteroid
			socket.emit("bullet hit asteroid", {index: hitAsteroid.index});
			// Remove local bullet and emit to server that bullet has been removed
			removeLocalBulletAndEmitToServer(i);
		}
		// Check if bullet is outside of game area
		else if (bullet.isOutsideGameArea(area.width, area.height)) {
			// Remove bullet and emit to server that bullet has been removed
			removeLocalBulletAndEmitToServer(i);
		}
	}
	
	// Update remote players' properties
	for (i = 0; i < remotePlayers.length; i++) {
		remotePlayer = remotePlayers[i];
		// Add smoke if remote player is accelerating
		if (remotePlayer.isAccelerating) {
			newSmoke = effect.getSmokeBehindSpaceShip(remotePlayer);
			smoke.push(newSmoke);
		}
		// Update remote player's bullet's positions
		for (j = 0; j < remotePlayer.bullets.length; j++) {
			bullet = remotePlayer.bullets[j];
			if (bullet) {
				bullet.update(td);
			}
		}
	}
	
	// Update positions of asteroids
	for (i = 0; i < asteroids.length; i++) {
		asteroid = asteroids[i];
		
		// Skip this iteration if asteroid was removed during the loop (there may be a lag between server and client)
		if (!asteroid) continue;
		
		asteroid.update(td);
	}
	
	// Update smoke
	smoke = effect.updateSmoke(td, smoke);
	
	// Update canvas offsets to local players new position
	updateCanvasOffsets();
}

// Update statistics after kill
function updateAfterKill(killedPlayer, playerWhoShot) {
	// Increment death stats by 1 on killed player
	killedPlayer.deaths++;
	
	// Add explosion effects
	smoke = effect.addExplosion(killedPlayer.position, smoke);
	sound.explode.play(getVolume(killedPlayer.position));
	
	// Make player disappear from screen
	killedPlayer.limbo = true;
	killedPlayer.position = new Vector(-killedPlayer.height, -killedPlayer.height);
	
	// Update stats modal
	stats.update(killedPlayer, "deaths");
	
	// Increment kill stats by 1 on player who shot (if killed player didn't die on collision for example)
	if (playerWhoShot) {
		playerWhoShot.kills++;
		stats.update(playerWhoShot, "kills");
		log.print(aliasTag(playerWhoShot) + " killed " + aliasTag(killedPlayer) + "!");
	}
	
	// Reset killed player health
	killedPlayer.health = 100;
	
	// Make killed player immune for set immuneTime
	killedPlayer.makeImmune();
}

// Adjust canvas offsets to local player's position
function updateCanvasOffsets() {	
	var x = localPlayer.position.x,
			y = localPlayer.position.y,
			// Spaces between canvas borders and local player's position when moving towards game area border
			paddingX = canvas.width*0.45,
			paddingY = canvas.height*0.45;
	
	// Adjust x offset if the position out of bounds
	if (x > canvas.offset.x + canvas.width - paddingX) {
		canvas.offset.x += x - (canvas.offset.x + canvas.width - paddingX);
	}
	else if (x < canvas.offset.x + paddingX) {
		canvas.offset.x -= canvas.offset.x + paddingX - x;
	}
	
	// Adjust y offset if the position out of bounds
	if (y > canvas.height + canvas.offset.y - paddingY) {
		canvas.offset.y += y - (canvas.height + canvas.offset.y - paddingY);
	}
	else if (y < canvas.offset.y + paddingY) {
		canvas.offset.y -= canvas.offset.y + paddingY - y;
	}
	
	// Keep "camera" inside game area
	if (canvas.offset.x < 0) canvas.offset.x = 0;
	else if (canvas.offset.x > area.width - canvas.width) canvas.offset.x = area.width - canvas.width;
	if (canvas.offset.y < 0) canvas.offset.y = 0;
	else if (canvas.offset.y > area.height - canvas.height) canvas.offset.y = area.height - canvas.height;
	
	// Update offsets on game background
	canvas.style.backgroundPosition = -canvas.offset.x + "px " + -canvas.offset.y + "px";
}

// Set space ship start properties (on initialization and re-spawn)
function setLocalPlayerStartProperties() {
	var startX        = random(canvas.width*0.1, canvas.width - canvas.width*0.1),
			startY        = random(canvas.width*0.1, canvas.height - canvas.width*0.1),
			startVelocity = new Vector(0, 0);
			startRotation = random(0, 360)*(Math.PI/180);
	
	localPlayer.position  = new Vector(startX, startY);
	localPlayer.velocity  = startVelocity;
	localPlayer.rotation  = startRotation;
	localPlayer.limbo     = false;

	if (socket) {	
		// Emit to server that local player has re-spawned
		socket.emit("respawn player");
	}
}

/**
 * Game draw
 */
function draw() {
	var i, j, remotePlayer, bullet, asteroid;

	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	// Draw smoke effects
	effect.drawSmoke(ctx, smoke, canvas.offset);

	// Draw the local player's bullets and the local player
	for (i = 0; i < localPlayer.bullets.length; i++) {
		bullet = localPlayer.bullets[i];
		// Only draw bullet if it is in view
		if (bullet && !bullet.isOutsideGameArea(canvas.width, canvas.height, canvas.offset.x, canvas.offset.y))
			bullet.draw(ctx, canvas.offset);
	}
	localPlayer.draw(ctx, canvas.offset);
	
	// Draw arrows indicating local players position if outside of game area
	if (localPlayer.isOutsideGameArea(area.width, area.height)) {
		drawLocalPlayerPositionIndicators();
	}
	
	// Draw remote players' bullets and the remote players
	for (i = 0; i < remotePlayers.length; i++) {
		remotePlayer = remotePlayers[i];
		// Draw bullets (if they are inside canvas)
		for (j = 0; j < remotePlayer.bullets.length; j++) {
			bullet = remotePlayer.bullets[j];
			if (bullet && !bullet.isOutsideGameArea(canvas.width, canvas.height, canvas.offset.x, canvas.offset.y))
				bullet.draw(ctx, canvas.offset);
		}
		// Draw player (if it is inside canvas)
		if (remotePlayer && !remotePlayer.isOutsideGameArea(canvas.width, canvas.height, canvas.offset.x, canvas.offset.y))
			remotePlayer.draw(ctx, canvas.offset);
	}
	
	// Draw asteroids (if they are inside canvas)
	for (i = 0; i < asteroids.length; i++) {
		asteroid = asteroids[i];
		if (asteroid && !asteroid.isOutsideGameArea(canvas.width, canvas.height, canvas.offset.x, canvas.offset.y))
			asteroid.draw(ctx, canvas.offset);
	}
	
	// Draw clock showing time left of current round
	drawClock();
	
	// Draw map
	drawMap();
}

// Draw clock showing time left of current round
function drawClock() {
	var clockFontSize, margin, timeLeft;

	margin = Math.min(canvas.width, canvas.height) * 0.05;
	clockFontSize = canvas.height * 0.2;
	timeLeft = roundTime - (Date.now() - startTime) + 1000;
	
	ctx.save();
	
	ctx.font = clockFontSize + "px verdana";
	ctx.strokeStyle = timeLeft > 5000 ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 0, 0, 0.8)";
	ctx.fillStyle = timeLeft > 5000 ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 0, 0, 0.1)";
	
	ctx.fillText(msToMMSS(timeLeft), margin, canvas.height - margin);
	ctx.strokeText(msToMMSS(timeLeft), margin, canvas.height - margin);
	
	ctx.restore();
}

// Draw game area map
function drawMap() {
	var mapWidth, mapHeight, mapRatio, margin, x, y, mapAreaRatioX, mapAreaRatioY,
			viewWidth, viewHeight, viewOffsetX, viewOffsetY, viewLineLength,
			localPlayerX, localPlayerY, remotePlayerX, remotePlayerY, i;
	
	// The ratio of game area dimensions
	mapRatio = area.width / area.height;
	
	// Set map dimensions depending on canvas dimensions
	if (canvas.width > canvas.height) {
		mapHeight = canvas.height * 0.35;
		mapWidth  = mapHeight * mapRatio;
		margin = canvas.height * 0.05;
	} else {
		mapWidth  = canvas.width * 0.35;
		mapHeight = mapWidth / mapRatio;
		margin = canvas.width * 0.05;
	}
	
	// Ratio between map and area
	mapAreaRatioX = mapWidth / area.width;
	mapAreaRatioY = mapHeight / area.height;	
	
	// Set dimensions and offsets for the current view
	viewWidth      = canvas.width * mapAreaRatioX;
	viewHeight     = canvas.height * mapAreaRatioY;
	viewOffsetX    = canvas.offset.x * mapAreaRatioX;
	viewOffsetY    = canvas.offset.y * mapAreaRatioY;
	viewLineLength = Math.min(viewWidth, viewHeight)*0.25;
	
	// Set dimensions for local player position indicator
	localPlayerX = localPlayer.position.x * mapAreaRatioX;
	localPlayerY = localPlayer.position.y * mapAreaRatioY;
	
	// Set the coordinates for where to start drawing the map
	x = canvas.width - margin - mapWidth;
	y = canvas.height - margin - mapHeight;
	
	// Draw the map
	ctx.save();
	ctx.translate(x, y);
	// Map border and fill
	ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
	ctx.fillRect(0, 0, mapWidth, mapHeight);
	ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
	ctx.strokeRect(0, 0, mapWidth, mapHeight);
	// Map grid
	ctx.beginPath();
	ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
	for (i = 1; i < 8; i++) { // Vertical lines
		ctx.moveTo(i * mapWidth / 8, 0);
		ctx.lineTo(i * mapWidth / 8, mapHeight);
	}
	for (i = 1; i < 6; i++) { // Horizontal lines
		ctx.moveTo(0, i * mapHeight / 6);
		ctx.lineTo(mapWidth, i * mapHeight / 6);
	}
	ctx.closePath();
	ctx.stroke();
	// Map view
	ctx.strokeStyle = "hsla(90, 100%, 50%, 0.8)";
	ctx.beginPath();
	// Top left
	ctx.moveTo(viewOffsetX, viewOffsetY);
	ctx.lineTo(viewOffsetX + viewLineLength, viewOffsetY);
	ctx.moveTo(viewOffsetX, viewOffsetY);
	ctx.lineTo(viewOffsetX, viewOffsetY + viewLineLength);
	// Bottom left
	ctx.moveTo(viewOffsetX, viewOffsetY + viewHeight);
	ctx.lineTo(viewOffsetX + viewLineLength, viewOffsetY + viewHeight);
	ctx.moveTo(viewOffsetX, viewOffsetY + viewHeight);
	ctx.lineTo(viewOffsetX, viewOffsetY + viewHeight - viewLineLength);
	// Top right
	ctx.moveTo(viewOffsetX + viewWidth, viewOffsetY);
	ctx.lineTo(viewOffsetX + viewWidth - viewLineLength, viewOffsetY);
	ctx.moveTo(viewOffsetX + viewWidth, viewOffsetY);
	ctx.lineTo(viewOffsetX + viewWidth, viewOffsetY + viewLineLength);
	// Bottom right
	ctx.moveTo(viewOffsetX + viewWidth, viewOffsetY + viewHeight);
	ctx.lineTo(viewOffsetX + viewWidth - viewLineLength, viewOffsetY + viewHeight);
	ctx.moveTo(viewOffsetX + viewWidth, viewOffsetY + viewHeight);
	ctx.lineTo(viewOffsetX + viewWidth, viewOffsetY + viewHeight - viewLineLength);
	ctx.closePath();
	ctx.stroke();
	// Local player position indicator
	ctx.fillStyle = "hsla(90, 100%, 50%, 0.8)";
	ctx.beginPath();
	ctx.arc(localPlayerX, localPlayerY, 2, 0, Math.PI*2, true);
	ctx.closePath();
	ctx.fill();
	ctx.strokeStyle = "hsla(90, 100%, 50%, 0.2)";
	ctx.beginPath();
	ctx.arc(localPlayerX, localPlayerY, 8, 0, Math.PI*2, true);
	ctx.closePath();
	ctx.stroke();
	// Remote player position indicators
	ctx.fillStyle = "hsla(0, 100%, 50%, 0.8)";
	for (i = 0; i < remotePlayers.length; i++) {
		ctx.beginPath();
		remotePlayerX = remotePlayers[i].position.x * mapAreaRatioX;
		remotePlayerY = remotePlayers[i].position.y * mapAreaRatioY;
		ctx.arc(remotePlayerX, remotePlayerY, 2, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fill();
	}
	ctx.restore();
}

// Draw local player position indicators (for when player is outside of arena)
function drawLocalPlayerPositionIndicators() {
	var margin = 20, // The distance between edge of canvas and arrow
			length = 12, // Length of arrow
			x,           // Arrow x position
			y;           // Arrow y position
	
	// Save canvas context
	ctx.save();
	
	// Position the arrow depending on players position
	if (localPlayer.position.x < 0) {
		x = margin;
		y = localPlayer.position.y - canvas.offset.y;
	}
	else if (localPlayer.position.x > area.width) {
		x = canvas.width - margin;
		y = localPlayer.position.y - canvas.offset.y;
	}	
	if (localPlayer.position.y < 0) {
		x = localPlayer.position.x - canvas.offset.x;
		y = margin;
	}
	else if (localPlayer.position.y > area.height) {
		x = localPlayer.position.x - canvas.offset.x;
		y = canvas.height - margin;
	}
	ctx.translate(x, y);
	
	// Rotate the arrow according to local player's rotation
	ctx.rotate(localPlayer.rotation);
	
	// Draw the arrow
	ctx.strokeStyle = "#fff";
	ctx.moveTo(-length/2, 0);
	ctx.lineTo(length/2, 0);
	ctx.lineTo(length/4, length/4);
	ctx.moveTo(length/2, 0);
	ctx.lineTo(length/4, -length/4);
	ctx.stroke();
	
	// Restore canvas context
	ctx.restore();
}

// Print ping and fps
function printPingFps() {
	var pingHTML = ping < 200 ? "Ping: " + ping : "<span style='color:#f00'>Ping: " + ping + "</span>";
			fpsHTML  = fps >= 30 ? "Fps: " + fps : "<span style='color:#f00'>Fps: " + fps + "</span>";
	
	$("#ping").html(pingHTML);
	$("#fps").html(fpsHTML);
}

/**
 * Objects collision check functions
 */
// Check if local bullet hit remote player
function bulletHasHitRemotePlayer(bulletPosition) {
	var i, remotePlayer, radius;
	for (i = 0; i < remotePlayers.length; i++) {
		remotePlayer = remotePlayers[i];
		radius = Math.max(remotePlayer.width/2 + Bullet.prototype.width, remotePlayer.height/2 + Bullet.prototype.width);
		
		// If player was actually hit
		if (remotePlayer.position.distanceTo(bulletPosition) < radius && !remotePlayer.isImmune) {
			remotePlayer.health -= Bullet.prototype.damage;
			
			// If player died
			if (remotePlayer.health <= 0) {
				updateAfterKill(remotePlayer, localPlayer);
			}
			
			return remotePlayer;
		}
	}
	
	return false;
}

// Check if local bullet hit asteroid
function bulletHasHitAsteroid(bulletPosition) {
	var i, asteroid, radius;
	for (i = 0; i < asteroids.length; i++) {
		asteroid = asteroids[i];
		radius = asteroid.diameter/2 + Bullet.prototype.width;
		// If asteroid was actually hit
		if (asteroid.position.distanceTo(bulletPosition) < radius) {
			return asteroid;
		}
	}
	
	return false;
}

// Check if asteroid has hit local player
function asteroidHasHitLocalPlayer() {
	var i, asteroid, radius;
	for (i = 0; i < asteroids.length; i++) {
		asteroid = asteroids[i];
		
		// Skip this iteration if asteroid was removed during the loop e.g. (there may be a lag between server and client)
		if (!asteroid) continue;
		
		// Set hit radius
		radius = asteroid.diameter/2 + Math.max(localPlayer.width, localPlayer.height);
		
		// If asteroid actually hit local player
		if (asteroid.position.distanceTo(localPlayer.position) < radius && !localPlayer.isImmune) {			
			return asteroid;
		}
	}
	
	return false;
}

/**
 * Helper functions
 */
// Get a random number
function random(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get a remote player by id
function playerById(id) {
	var i;
	for (i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].id == id)
			return remotePlayers[i];
	}

  return false;
}

// Remove bullet from local player's array and emit to server
function removeLocalBulletAndEmitToServer(bulletIndex) {
	// Remove bullet from local player's bullet array
	localPlayer.bullets.splice(bulletIndex, 1);			
	// Remove bullet from server
	socket.emit("remove bullet", {index: bulletIndex});
}

// Get HSL from hue
function hslFromHue(hue) {
	return "hsl(" + hue + ", 75%, 50%)";
}

// Get HTML <b> tag of player alias for printing in log e.g.
function aliasTag(player) {
	var bTag = "<b style='color:" + hslFromHue(player.hue) + "'>" + player.alias + "</b>";
	return bTag;
}

// Get time in MM:SS format from ms
function msToMMSS(time) {
	var time = parseInt(time),
			min = parseInt(time / 1000 / 60, 10),
			sec = parseInt(time / 1000 % 60, 10);
	
	if (time <= 0 || typeof time !== "number") {
		return "0:00";
	}
	
	if (sec < 10) sec = "0" + sec;
			
	return min + ":" + sec;
}

// Get sound effect playback volume based on event's distance to local player
function getVolume(position) {
	var c = 0.005, // Volume decrease coefficient
			distance = position.distanceTo(localPlayer.position),
			volume = 1 / (1 + distance*c);
	
	return volume;
}