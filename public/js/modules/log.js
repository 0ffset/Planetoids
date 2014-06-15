/**
 * In game log
 */
var log = {
	/**
	 * jQuery objects of DOM elements
	 */
	$log: $("#log"),            // In game log
	$msgDiv: $("#message-div"), // Message container
	$msg: $("#message"),        // Message input field
	
	/**
	 * Properties
	 */
	msgVisible: false, // If the message container is visible
	
	/**
	 * Initialize log
	 */
	init: function () {
		// Set start dimensions
		this.resize();
		
		// Show log
		this.$log.show();
	},
	
	/**
	 * Resize log according to window dimensions
	 */
	resize: function () {
		var logWidth, logHeight, ratio, margin;
		
		// Aspect ratio of log div
		ratio = 8/3;
		
		// Top and left margin of log div
		margin = Math.min(window.innerWidth, window.innerHeight) * 0.05;
		
		// Log div dimensions
		logWidth  = window.innerWidth * 0.3 - margin;
		logHeight = logWidth / ratio;
		
		if (logHeight > window.innerHeight * 0.3) {		
			logHeight = window.innerHeight * 0.3;
			logWidth  = logHeight * ratio;
		}
		
		// Set log position and dimensions
		this.$log.css({
			top: margin,
			left: margin,
			width: logWidth,
			height: logHeight
		});
		
		// Scroll down to bottom of log
		this.scrollToBottom();
		
		// Set dimensions on message div
		this.$msgDiv
			.css({
				top: parseInt(this.$log.css("top"), 10) + this.$log.outerHeight() + 20,
				left: this.$log.css("left"),
				width: this.$log.css("width")
			});
		
		// Set dimensions on message input
		this.$msg
			.css({
				width: this.$msg.parent().innerWidth() - this.$msg.prev().width() - 25
			});
	},
	
	/**
	 * Print in log
	 */
	print: function (message) {
		var now = ((new Date()).toLocaleTimeString()).slice(0, 5);
		
		// Append message to log
		$("<p></p>")
			.hide()
			.html(now + " " + message)
			.appendTo(this.$log)
			.fadeIn(200);
		
		// Scroll down to bottom of log
		this.scrollToBottom();
	},
	
	/**
	 * Scroll down to bottom of log
	 */
	scrollToBottom: function () {
		this.$log.scrollTop(this.$log[0].scrollHeight);
	},
	
	/**
	 * Show message container
	 */
	showMsg: function () {
		var $msg = this.$msg;
		this.$msgDiv.fadeIn(200, function () {
			$msg.focus();
		});
		this.msgVisible = true;
	},
	
	/**
	 * Hide message container
	 */
	hideMsg: function () {
		this.$msgDiv.fadeOut(200);
		this.$msg.val("");
		this.msgVisible = false;
	},
	
	/**
	 * Return value of message input field
	 */
	msgVal: function () {
		return this.$msg.val();
	}
};

window.log = log;