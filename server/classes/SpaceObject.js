/**
 * SpaceObject class (the generic class for objects in space)
 */

/***********************
** CONSTRUCTOR
************************/
function SpaceObject(startX, startY, startRotation) {
	this.x        = startX        || 0; // X position of space object
	this.y        = startY        || 0; // Y position of space object
	this.rotation = startRotation || 0; // Rotation of space object
};

SpaceObject.prototype.constructor = SpaceObject;

/***********************
** METHODS
************************/
// Check if object has moved outside game area
SpaceObject.prototype.isOutsideGameArea = function (areaWidth, areaHeight) {
	// Number of pixels objects are allowed to be outside of game area
	var offset = this.diameter || Math.max(this.width || 0, this.height || 0);

	return (
		this.x < -offset ||
		this.x > areaWidth + offset ||
		this.y < -offset ||
		this.y > areaHeight + offset
	);
};

exports.SpaceObject = SpaceObject;