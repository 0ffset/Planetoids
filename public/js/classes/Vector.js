/**
 * Vector class
 */
/***********************
** CONSTRUCTOR
************************/
function Vector(startX, startY) {
	this.x = startX || 0;
	this.y = startY || 0;
};

Vector.prototype.constructor = Vector;

/***********************
** METHODS
************************/
// Multiply with scalar
Vector.prototype.mulScalar = function (scalar) {
	return new Vector(this.x * scalar, this.y * scalar);
};
	
// Multiply itself with scalar
Vector.prototype.iMulScalar = function (scalar) {
	this.x *= scalar;
	this.y *= scalar;
	return this;
};
	
// Add with scalar
Vector.prototype.addScalar = function (scalar) {
	return new Vector(this.x + scalar, this.y + scalar);
};
	
// Add itself with scalar
Vector.prototype.iAddScalar = function (scalar) {
	this.x += scalar;
	this.y += scalar;
	return this;
};
	
// Add itself with Vector
Vector.prototype.iAddVector = function (vector) {
	this.x += vector.x;
	this.y += vector.y;
	return this;
};
	
// Calculate distance to point
Vector.prototype.distanceTo = function (vector) {
	var dx = this.x - vector.x,
			dy = this.y - vector.y,
			distance = Math.sqrt(dx*dx + dy*dy);
	return distance;
};

window.Vector = Vector;