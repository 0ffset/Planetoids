/**
 * Game start window
 */
$(document).ready(function () {
	var alias,
			startModalIsVisible = true;
	
	// Center start modal (and redo center on window resize)
	centerStartModal();
	$(window).on("resize", centerStartModal);
	
	// Hide loader
	$("#loader").fadeOut(500);
	
	// Show start modal (and controls modal to right of whats visible)
	$("#start-modal,#controls-modal").fadeIn(500);
	
	// Swap over to controls modal when user clicks on link
	$("#controls,#back-to-start").click(startModalToggle);
	
	// Initialize game when user clicks start button
	$("#start-form").on("submit", function (e) {		
		// Prevent form from actually submitting
		e.preventDefault();
		
		// Set alias to value of alias input
		alias = $("#alias").val();
		
		// Start game only if alias is specified
		if (alias !== "") {		
			// Fade out start modal and controls modal
			$("#start-modal,#controls-modal").fadeOut(200);
		
			// Show loader (and show error message on connection timeout)
			$("#loader").fadeIn(200);
			setTimeout(function () {
				$("<p>Is it taking too long? Refresh your browser and try again!</p>")
					.hide()
					.appendTo("#loader")
					.fadeIn(200);
			}, 5000);
			
			// Initialize game
			init(alias);
			
			// Hide cursor
			$(document.body).css("cursor", "none");
		}
		// Output error message if alias is empty
		else {
			$("#output")
				.hide()
				.text("You need to specify an alias!")
				.fadeIn(200, centerStartModal);
		}
	});

	/**
	 * Toggle between start modal and control modal
	 */
	function startModalToggle() {
		var swapSpeed = 500,    // Duration of animation (ms)
				swapEase = "swing", // Ease of animation
				startModalLeft,     // New CSS left property for start modal
				controlsModalLeft;  // New CSS left property for controls modal
		
		// Set right starting margins
		centerStartModal();
		
		// Set new css left properties depending on which modal is showing
		if (startModalIsVisible) {
			startModalLeft      = ($(window).width() - $("#start-modal").innerWidth()) / 2 - $(window).width();
			controlsModalLeft   = ($(window).width() - $("#controls-modal").innerWidth()) / 2;
			startModalIsVisible = false;
		}
		else {
			startModalLeft      = ($(window).width() - $("#start-modal").innerWidth()) / 2;
			controlsModalLeft   = ($(window).width() - $("#controls-modal").innerWidth()) / 2 + $(window).width();
			startModalIsVisible = true;
		}
		// Move start modal
		$("#start-modal").animate({
			left: startModalLeft
		}, swapSpeed, swapEase);
		// Move controls modal
		$("#controls-modal").animate({
			left: controlsModalLeft
		}, swapSpeed, swapEase);
	}

	/**
	 *	Center start modal and control modal
	 */
	function centerStartModal() {
		var animSpeed = 200,
				startModalLeft,
				controlsModalLeft;
		
		// Set the css left property depending on which modal is showing
		if (startModalIsVisible) {
			startModalLeft = ($(window).width() - $("#start-modal").innerWidth()) / 2;
			controlsModalLeft = ($(window).width() - $("#controls-modal").innerWidth()) / 2 + $(window).width();
		}
		else {
			startModalLeft = ($(window).width() - $("#start-modal").innerWidth()) / 2 - $(window).width();
			controlsModalLeft = ($(window).width() - $("#controls-modal").innerWidth()) / 2;
		}
		
		// Change the actual css properties
		$("#start-modal").animate({
			top: ($(window).height() - $("#start-modal").innerHeight()) / 2,
			left: startModalLeft
		}, animSpeed);
		$("#controls-modal").animate({
			top: ($(window).height() - $("#controls-modal").innerHeight()) / 2,
			left: controlsModalLeft
		}, animSpeed);
		
		// Make sure margin doesn't get negative
		if (parseInt($("#start-modal").css("top"), 10) < 0) {
			$("#start-modal").css({
				top: 0
			});
		}
		if (parseInt($("#controls-modal").css("top"), 10) < 0) {
			$("#controls-modal").css({
				top: 0
			});
		}
	}
});