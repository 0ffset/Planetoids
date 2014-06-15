/**
 * In game modal window for statistics
 */
var stats = {
	/**
	 * jQuery objects of DOM elements
	 */
	$stats:      $("#stats-modal"),        // Statistics modal window
	$tbody:      $("#stats-table tbody"),  // Statistics table body
	$numPlayers: $("#players-online"),     // Span showing number of players online
	$newRound:   $("#newround-modal"),     // Modal window displayed on new round
	$winner:     $("#winner"),             // Paragraph in new round modal showing last round's winner and score
	$stopwatch:  $("#newround-stopwatch"), // Stopwatch in new round modal counting down to new round
	
	/**
	 * Initialization function
	 */
	init: function () {
		this.resize();
	},
	
	/**
	 * Show/hide stats modal
	 */
	show: function () { this.$stats.show(); },
	hide: function () { this.$stats.hide(); },
	
	/**
	 * Resize according to window size
	 */
	resize: function () {
		// Resize stats modal
		this.$stats
			.css({
				top: ($(window).height() - $(this.$stats).height()) / 2,
				left: ($(window).width() - $(this.$stats).width()) / 2
			});
		
		// Resize new round modal
		this.$newRound
			.css({
				top: ($(window).height() - this.$newRound.height()) / 2,
				left: ($(window).width() - this.$newRound.width()) / 2
			});
	},
	
	/**
	 * Add row for now player in statistics table
	 */
	addPlayer: function (player, trClass) {
		var i, prop, props;
		
		trClass = trClass || "";
		
		// Append new table row
		$("<tr></tr>")
			.attr("id", player.id)
			.addClass(trClass)
			.appendTo(this.$tbody);
		
		// Append table cells for each property
		props = ["alias", "kills", "asteroidsShot", "deaths"];
		for (i = 0; i < props.length; i++) {
			$("<td></td>")
				.attr("id", player.id + "-" + props[i])
				.text(player[props[i]])
				.appendTo("#" + player.id);
		}
		
		$("#" + player.id + "-" + "alias").css("color", hslFromHue(player.hue));
		
		$("<td></td>")
			.attr("id", player.id + "-" + "score")
			.text(player.score())
			.appendTo("#" + player.id);
		
		// Sort stats modal
		this.sort();
		
		// Update number of players online
		this.updateNumPlayers();
	},
	
	/**
	 * Remove player from statistics table
	 */
	removePlayer: function (player) {
		var selector = "#" + player.id;
		
		// Remove player's row in statistics table
		$(selector).remove();
		
		// Update number of players online
		this.updateNumPlayers();
	},
	
	/**
	 * Remove all players from statistics table
	 */
	removeAll: function () {
		// Remove all content in table body of statistics table
		this.$tbody.text("");
		
		// Update number of players online
		this.updateNumPlayers();
	},
	
	/**
	 * Update player row
	 */
	update: function (player, prop) {
		var selector;
		
		// Update value of provided property
		selector = "#" + player.id + "-" + prop;
		$(selector).text(player[prop]);
		
		// Update total score
		selector = "#" + player.id + "-score";
		$(selector).text(player.score());
		
		// Sort stats modal
		this.sort();
	},
	
	/**
	 * Reset all values
	 */
	reset: function () {
		var selector = "[id$='-kills'],[id$='-deaths'],[id$='-asteroidsShot'],[id$='-score']";
		
		$(selector).text("0");
		
		// Sort stats modal by alias
		this.sort("alias");
	},
	
	/**
	 * Sort statistics table
	 */
	sort: function (col) {
		col = col || "score"; // The column to be sorted by
		
		// Create new table that is sorted, based on existing table
		var sorted = this.$tbody
									.find("> tr")
									.sort(function (trA, trB) {
										a = parseInt($(trA).find("[id$='"+col+"']").text(), 10);
										b = parseInt($(trB).find("[id$='"+col+"']").text(), 10);
										return a > b ? -1 : 1;
									});
		
		// Replace existing table with sorted one
		this.$tbody.append(sorted);
	},
	
	/**
	 * Update number of players online
	 */
	updateNumPlayers: function () {
		this.$numPlayers.text(this.$tbody.children().length)
	},
	
	/**
	 * Show modal window with last round's winner and stopwatch on new round
	 */
	showNewRoundModal: function (winner, score) {
		var now = Date.now(),
				$stopwatch = this.$stopwatch,
				$newRound  = this.$newRound,
				$winner    = this.$winner,
				intervalId,
				counter;
		
		// Print out winner
		$winner.html(aliasTag(winner) + " won last round with a score of " + score + "!");
		
		// Show stopwatch and decrement counter value every second
		counter = countDown;
		$stopwatch.text(msToMMSS(counter));
		intervalId = setInterval(function () {
			counter -= 1000;
			$stopwatch.text(msToMMSS(counter));
		}, 1000);
		
		// Show new round modal
		$newRound.fadeIn(200);
		
		// Fade out new round modal after countDown
		setTimeout(function () {
			clearInterval(intervalId);
			$newRound.fadeOut(200);
		}, countDown);
	}
};

window.stats = stats;