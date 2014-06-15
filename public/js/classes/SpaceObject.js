/**
 * SpaceObject class (the generic class for space objects)
 */

/***********************
** CONSTRUCTOR
************************/
function SpaceObject(startX, startY, startRotation, startVelocity) {
	this.position = new Vector(startX || 0, startY || 0); // The object's position on the canvas
	this.rotation = startRotation || 0;                   // The object's rotation
	this.velocity = startVelocity || new Vector(0, 0);    // The object's velocity
}

SpaceObject.prototype.constructor = SpaceObject;

/***********************
** METHODS
************************/
/**
 * Make the object move (as a result of changing its position according to its velocity)
 */
SpaceObject.prototype.move = function (td) {
	this.position.iAddVector(this.velocity.mulScalar(td));
};

/**
 * Make the object rotate (as a result of changing its rotation according to its rotation speed)
 */
SpaceObject.prototype.rotate = function (td, rotationSpeed) {
	var rotationSpeed = rotationSpeed || this.rotationSpeed || 0;
	this.rotation += rotationSpeed * td;
};

/**
 * Check if object has moved outside game area
 */
SpaceObject.prototype.isOutsideGameArea = function (areaWidth, areaHeight, offsetX, offsetY) {
	// Number of pixels objects are allowed to be outside of game area
	var margin = this.diameter || Math.max(this.width || 0, this.height || 0);
	
	// Offset, if area is only part of total game area
	offsetX = offsetX || 0;
	offsetY = offsetY || 0;
	
	return (
		this.position.x - offsetX < -margin ||
		this.position.x - offsetX > areaWidth + margin ||
		this.position.y - offsetY < -margin ||
		this.position.y - offsetY > areaHeight + margin
	);
};

window.SpaceObject = SpaceObject;