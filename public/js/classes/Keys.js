/**
 * Game keyboard class
 */
/***********************
** CONSTRUCTOR
************************/
function Keys(forward, back, left, right, shoot) {
	this.FORWARD = forward || 38; // default: up arrow
	this.BACK    = back    || 40; // default: down arrow
	this.LEFT    = left    || 37; // default: left arrow
	this.RIGHT   = right   || 39; // default: right arrow
	this.SHOOT   = shoot   || 32; // default: space
	this.MUTE    = 77; // m
	this.TAB     = 9;  // tab
	this.MESSAGE = 13; // enter
	this.pressed = {}; // Object containing pressed keys
};

Keys.prototype.constructor = Keys;

/***********************
** METHODS
************************/
// Add key code to pressed object on key down
Keys.prototype.onKeydown = function (event) {
	this.pressed[event.keyCode] = true;
};
  
// Remove key code from this.pressed on key down
Keys.prototype.onKeyup = function (event) {
	delete this.pressed[event.keyCode];
};
	
// Check if key is down
Keys.prototype.isKeydown = function (keyCode) {
	return this.pressed[keyCode];
};

window.Keys = Keys;