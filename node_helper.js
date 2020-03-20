/* Magic Mirror
 * Node Helper: Newsfeed
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * Additional Capability: N Scott
 * MIT Licensed.
 */

/*
 * renamed all News/news/NEWS to RSS/rss/RSS
 */

var NodeHelper = require("node_helper");
var validUrl = require("valid-url");
var RSSFetcher = require("./RSSfetcher.js");

module.exports = NodeHelper.create({
	// Subclass start method.

	start: function() {
		console.log("Starting module: " + this.name);
		this.RSSfetchers = [];
	},

	// Subclass socketNotificationReceived received.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "ADD_FEED") {
			this.createRSSFetcher(payload.feed, payload.config);
			return;
		}
	},

	/* createFetcher(feed, config)
	 * Creates a fetcher for a new feed if it doesn't exist yet.
	 * Otherwise it reuses the existing one.
	 *
	 * attribute feed object - A feed object.
	 * attribute config object - A configuration object containing reload interval in milliseconds.
	 */

	createRSSFetcher: function(feed, config) {
		var self = this;

		var url = feed.url || "";
		var encoding = feed.encoding || "UTF-8";
		var reloadInterval = feed.reloadInterval || config.reloadInterval || 5 * 60 * 1000;

		if (!validUrl.isUri(url)) {
			self.sendSocketNotification("INCORRECT_URL", url);
			return;
		}

		var RSSfetcher;
		if (typeof self.RSSfetchers[url] === "undefined") {
			console.log(this.name + "Create new RSS fetcher for url: " + url + " - Interval: " + reloadInterval);
			RSSfetcher = new RSSFetcher(url, reloadInterval, encoding, config.logFeedWarnings, config.ignoreCategories, config.ignoreCategoryList);

			//added new XML stuff at end of new RSSfetcher call

			//end of add

			RSSfetcher.onReceive(function (RSSfetcher) {
				self.broadcastFeeds();
			});

			RSSfetcher.onError(function (RSSfetcher, error) {
				self.sendSocketNotification("FETCH_ERROR", {
					url: RSSfetcher.RSSurl(),
					error: error
				});
			});

			self.RSSfetchers[url] = RSSfetcher;
		} else {
			console.log(this.name + "Use existing RSS fetcher for url: " + url);
			RSSfetcher = self.RSSfetchers[url];
			RSSfetcher.setReloadInterval(reloadInterval);
			RSSfetcher.broadcastItems();

		}

		RSSfetcher.startFetch();
	},

	/* broadcastFeeds()
	 * Creates an object with all feed items of the different registered feeds,
	 * and broadcasts these using sendSocketNotification.
	 */

	broadcastFeeds: function() {
		var feeds = {};
		for (var f in this.RSSfetchers) {
			feeds[f] = this.RSSfetchers[f].items();
		}
		this.sendSocketNotification("RSS_ITEMS", feeds);
	}
});
