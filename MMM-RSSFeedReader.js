/* global Module */

/* Magic Mirror
 * Module: MMM-RSSFeedReader
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * Additional Capability: N Scott
 * MIT Licensed.
 */

/*
 * renamed all News/news/NEWS to RSS/rss/RSS
 */

/*
 * forked newsfeeder and adds support for standard RSS 2.0 datatypes
 * and looks for embeddd images in cdata, if it is present
 * also processes ATOM format feeds (reddit etc)
 */

/* 
 * https://validator.w3.org/feed/docs/rss2.html
 */

//The first line in the document - 
// defines the XML version and the character encoding used in the document.
//	In this case the document conforms to the 1.0 specification of XML and uses the UTF - 8 character set.
//The next line is the RSS declaration which identifies that this is an RSS document(in this case, RSS version 2.0).

//<? xml version = "1.0" encoding = "UTF-8" ?>
//	<rss version="2.0">

//The next line contains the < channel > element.This element is used to describe the RSS feed.
//The < channel > element has three required child elements:
//	<title> - Defines the title of the channel (e.g. W3Schools Home Page)
//	<link> - Defines the hyperlink to the channel (e.g. https://www.w3schools.com)
//	<description> - Describes the channel (e.g. Free web building tutorials)
//Each <channel> element can have one or more <item> elements.
//Each <item> element defines an article or "story" in the RSS feed.
//The <item> element has three required child elements:
//	<title> - Defines the title of the item (e.g. RSS Tutorial)
//	<link> - Defines the hyperlink to the item (e.g. https://www.w3schools.com/xml/xml_rss.asp)
//	Optionally the item can have:
//	<description> - Describes the item (e.g. New RSS tutorial on W3Schools)
//	<author> child element is used to specify the e - mail address of the author of an item.
//	<comments > child element allows an item to link to comments about that item.
//	<enclosure > child element allows a media - file to be included with an item.
//	The <enclosure > element has three required attributes:
//		url - Defines the URL to the media file
//		length - Defines the length(in bytes) of the media file
//		type - Defines the type of media file

//The < category > child element is used to specify a category for your feed.
//The < category > element makes it possible for RSS aggregators to group sites based on category.
//The < copyright > child element notifies about copyrighted material.

//The < image > child element allows an image to be displayed when aggregators present a feed.
//The < image > element has three required child elements:
//	<url> - Defines the URL to the image
//	<title> - Defines the text to display if the image could not be shown
//	<link> - Defines the hyperlink to the website that offers the channel

Module.register("MMM-RSSFeedReader", {

	// Default module config.
	defaults: {
		feeds: [
			{
				title: "Elle",
				url: "https://www.elle.com/rss/all.xml/",
				encoding: "UTF-8" //ISO-8859-1
			}
		],
		showSourceTitle: true,
		showPublishDate: true,
		broadcastRSSFeeds: true,
		broadcastRSSUpdates: true,
		showDescription: true,
		showImage: true,
		maxImageWidth: '400px', //will be used to resize the image
		maxImageHeight: '600px', //will be used to crop the image
		constrainModuleWidth: false,
		maxModuleWidth: '600px', //will be used if required to constrain this modules total width,controlled by the switch above
		processContentForImages: true,
		showVersion: false,
		debugToMM: false,
		wrapTitle: true,
		wrapDescription: true,
		truncDescription: true,
		lengthDescription: 400,
		hideLoading: false,
		reloadInterval: 5 * 60 * 1000, // every 5 minutes
		updateInterval: 10 * 1000, // 10 seconds
		animationSpeed: 2.5 * 1000,
		maxRSSItems: 0, // 0 for unlimited
		ignoreOldItems: false,
		ignoreOlderThan: 12 * 24 * 60 * 60 * 1000, // 12 days
		ignoreCategories: true, //if true, check categories match the list below and ignore them (case insensitive match so enter in lower case only in the list)
		ignoreCategoryList: ["horoscopes"],
		removeStartTags: "",
		removeEndTags: "",
		startTags: [],
		endTags: [],
		prohibitedWords: [],
		scrollLength: 500,
		logFeedWarnings: false
	},

	// Define required scripts.
	getScripts: function () {
		return ["moment.js"];
	},

	// Define required translations.
	getTranslations: function () {
		// The translations for the default modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionary.
		// If you're trying to build your own module including translations, check out the documentation.
		return false;
	},

	// Define start sequence.
	start: function () {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.rssItems = [];
		this.loaded = false;
		this.activeItem = 0;
		this.scrollPosition = 0;

		this.registerFeeds();

		this.isShowingDescription = this.config.showDescription;
	},

	// Override socket notification handler.
	socketNotificationReceived: function (notification, payload) {
		if (notification === "RSS_ITEMS") {
			this.generateFeed(payload);

			if (!this.loaded) {
				this.scheduleUpdateInterval();
			}

			this.loaded = true;
		}
	},

	// Override dom generator.
	getDom: function () {

		var wrapper = document.createElement("div");

		if (this.config.constrainModuleWidth) {
			wrapper.style.width = this.config.maxModuleWidth;
			wrapper.style.textAlign = "center";
		}

		if (this.config.feedUrl) {
			wrapper.className = "small bright";
			wrapper.innerHTML = this.translate("configuration_changed");
			return wrapper;
		}

		if (this.activeItem >= this.rssItems.length) {
			this.activeItem = 0;
		}

		if (this.rssItems.length > 0) {

			// this.config.showFullArticle is a run-time configuration, triggered by optional notifications
			var sourceAndTimestamp = document.createElement("div"); //we require this div for the image, if displayed

			if (!this.config.showFullArticle && (this.config.showSourceTitle || this.config.showPublishDate)) {

				sourceAndTimestamp.className = "rssfeed-source light small dimmed";

				if (this.config.showSourceTitle && this.rssItems[this.activeItem].sourceTitle !== "") {
					sourceAndTimestamp.innerHTML = this.rssItems[this.activeItem].sourceTitle;
				}
				if (this.config.showSourceTitle && this.rssItems[this.activeItem].sourceTitle !== "" && this.config.showPublishDate) {
					sourceAndTimestamp.innerHTML += ", ";
				}
				if (this.config.showPublishDate) {
					sourceAndTimestamp.innerHTML += moment(new Date(this.rssItems[this.activeItem].pubdate)).fromNow();
				}
				if (this.config.showSourceTitle && this.rssItems[this.activeItem].sourceTitle !== "" || this.config.showPublishDate) {
					sourceAndTimestamp.innerHTML += ":";
				}

				// added DOM creation for Images and other stuff from an XML feed

				var imageDisplay = document.createElement('div');

				console.log("Loading Images");

				var tempimage = this.rssItems[this.activeItem];

				var textlength = tempimage.description.length;
				var captionSuffix = "";

				if (this.config.truncDescription) {
					if (self.config.lengthDescription < textlength) {
						captionSuffix = ".......";
					};
					textlength = self.config.lengthDescription - captionSuffix.length;
				};

				var imageLink = document.createElement('div');
				imageLink.id = "MMM-RSSFeedReader-image";

				//add a nice feathered edge using CSS

				//<div style="mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 0%, black 3%, black 97%, transparent 100%);">
				//	<img src="../modules/MMM-BackgroundSlideshow/exampleImages/230241.jpg" alt="" height="500" style="mask-image: linear-gradient(to right, rgba(0,0,0,0) 0%, black 3%, black 97%, transparent 100%);" />
				//</div>

				imageLink.style = "overflow:hidden; max-height:" + `${this.config.maxImageHeight}` + ";mask-image:linear-gradient(to bottom, rgba(0,0,0,0) 0%, black 3%, black 97%, transparent 100%);";
				//imageLink.style.width = `${this.config.maxImageWidth}`; //this breaks the centering of the image
				//imageLink.style.maskimage = "linear-gradient(to bottom, rgba(0,0,0,0) 0%, black 3%, black 97%, transparent 100%);";


				if (this.config.showImage) { imageLink.innerHTML = "<img src='" + tempimage.image + `' width='${this.config.maxImageWidth}' style="margin-left: auto;margin-right: auto;display: block;mask-image: linear-gradient(to right, rgba(0,0,0,0) 0%, black 3%, black 97%, transparent 100%);">` };
				imageLink.innerHTML += "<p class='light' style='text-align: center;'> " + tempimage.description.substring(0, textlength) + captionSuffix; +"</p>";

				imageDisplay.appendChild(imageLink);

				sourceAndTimestamp.appendChild(imageDisplay);

				//end of new XML stuff

			}
			else {

				if (this.config.showImage) {

					var imageDisplay = document.createElement('div');

					var tempimage = this.rssItems[this.activeItem];


					var imageLink = document.createElement('div');
					imageLink.id = "MMM-RSSFeedReader-image";

					imageLink.style = "overflow:hidden; max-height:" + `${this.config.maxImageHeight}` + ";mask-image:linear-gradient(to bottom, rgba(0,0,0,0) 0%, black 3%, black 97%, transparent 100%);";

					if (this.config.showImage) { imageLink.innerHTML = "<img src='" + tempimage.image + `' width='${this.config.maxImageWidth}' style="margin-left: auto;margin-right: auto;display: block;mask-image: linear-gradient(to right, rgba(0,0,0,0) 0%, black 3%, black 97%, transparent 100%);">` };

					imageDisplay.appendChild(imageLink);

					sourceAndTimestamp.appendChild(imageDisplay);

				}
			}

			wrapper.appendChild(sourceAndTimestamp);

			//Remove selected tags from the beginning of rss feed items (title or description)

			if (this.config.removeStartTags === "title" || this.config.removeStartTags === "both") {

				for (f = 0; f < this.config.startTags.length; f++) {
					if (this.rssItems[this.activeItem].title.slice(0, this.config.startTags[f].length) === this.config.startTags[f]) {
						this.rssItems[this.activeItem].title = this.rssItems[this.activeItem].title.slice(this.config.startTags[f].length, this.rssItems[this.activeItem].title.length);
					}
				}

			}

			if (this.config.removeStartTags === "description" || this.config.removeStartTags === "both") {

				if (this.isShowingDescription) {
					for (f = 0; f < this.config.startTags.length; f++) {
						if (this.rssItems[this.activeItem].description.slice(0, this.config.startTags[f].length) === this.config.startTags[f]) {
							this.rssItems[this.activeItem].description = this.rssItems[this.activeItem].description.slice(this.config.startTags[f].length, this.rssItems[this.activeItem].description.length);
						}
					}
				}

			}

			//Remove selected tags from the end of rss feed items (title or description)

			if (this.config.removeEndTags) {
				for (f = 0; f < this.config.endTags.length; f++) {
					if (this.rssItems[this.activeItem].title.slice(-this.config.endTags[f].length) === this.config.endTags[f]) {
						this.rssItems[this.activeItem].title = this.rssItems[this.activeItem].title.slice(0, -this.config.endTags[f].length);
					}
				}

				if (this.isShowingDescription) {
					for (f = 0; f < this.config.endTags.length; f++) {
						if (this.rssItems[this.activeItem].description.slice(-this.config.endTags[f].length) === this.config.endTags[f]) {
							this.rssItems[this.activeItem].description = this.rssItems[this.activeItem].description.slice(0, -this.config.endTags[f].length);
						}
					}
				}

			}

			if (!this.config.showFullArticle) {
				var title = document.createElement("div");
				title.className = "rssfeed-title bright medium light" + (!this.config.wrapTitle ? " no-wrap" : "");
				title.innerHTML = this.rssItems[this.activeItem].title;
				wrapper.appendChild(title);
			}

			if (this.isShowingDescription) {
				var description = document.createElement("div");
				description.className = "rssfeed-desc small light" + (!this.config.wrapDescription ? " no-wrap" : "");
				var txtDesc = this.rssItems[this.activeItem].description;
				description.innerHTML = (this.config.truncDescription ? (txtDesc.length > this.config.lengthDescription ? txtDesc.substring(0, this.config.lengthDescription) + "..." : txtDesc) : txtDesc);
				wrapper.appendChild(description);
			}

			if (this.config.showFullArticle) {
				var fullArticle = document.createElement("iframe");
				fullArticle.className = "";
				fullArticle.style.width = "100vw";
				// very large height value to allow scrolling
				fullArticle.height = "3000";
				fullArticle.style.height = "3000";
				fullArticle.style.top = "0";
				fullArticle.style.left = "0";
				fullArticle.style.border = "none";
				fullArticle.src = this.getActiveItemURL();
				fullArticle.style.zIndex = 1;
				wrapper.appendChild(fullArticle);
			}

			if (this.config.hideLoading) {
				this.show();
			}

		} else {
			if (this.config.hideLoading) {
				this.hide();
			} else {
				wrapper.innerHTML = this.translate("LOADING");
				wrapper.className = "small dimmed";
			}
		}

		return wrapper;
	},

	getActiveItemURL: function () {
		return typeof this.rssItems[this.activeItem].url === "string" ? this.rssItems[this.activeItem].url : this.rssItems[this.activeItem].url.href;
	},

	/* registerFeeds()
	 * registers the feeds to be used by the backend.
	 */
	registerFeeds: function () {
		for (var f in this.config.feeds) {
			var feed = this.config.feeds[f];
			this.sendSocketNotification("ADD_FEED", {
				feed: feed,
				config: this.config
			});
		}
	},

	/* generateFeed()
	 * Generate an ordered list of items for this configured module.
	 *
	 * attribute feeds object - An object with feeds returned by the node helper.
	 */

	generateFeed: function (feeds) {
		var rssItems = [];
		for (var feed in feeds) {
			var feedItems = feeds[feed];
			if (this.subscribedToFeed(feed)) {
				for (var i in feedItems) {
					var item = feedItems[i];
					item.sourceTitle = this.titleForFeed(feed);
					if (!(this.config.ignoreOldItems && ((Date.now() - new Date(item.pubdate)) > this.config.ignoreOlderThan))) {
						rssItems.push(item);
					}
				}
			}
		}
		rssItems.sort(function (a, b) {
			var dateA = new Date(a.pubdate);
			var dateB = new Date(b.pubdate);
			return dateB - dateA;
		});
		if (this.config.maxRSSItems > 0) {
			rssItems = rssItems.slice(0, this.config.maxRSSItems);
		}

		if (this.config.prohibitedWords.length > 0) {
			rssItems = rssItems.filter(function (value) {
				for (var i = 0; i < this.config.prohibitedWords.length; i++) {
					if (value["title"].toLowerCase().indexOf(this.config.prohibitedWords[i].toLowerCase()) > -1) {
						return false;
					}
				}
				return true;
			}, this);
		}

		// get updated rss items and broadcast them
		var updatedItems = [];
		rssItems.forEach(value => {
			if (this.rssItems.findIndex(value1 => value1 === value) === -1) {
				// Add item to updated items list
				updatedItems.push(value);
			}
		});

		// check if updated items exist, if so and if we should broadcast these updates, then lets do so
		if (this.config.broadcastRSSUpdates && updatedItems.length > 0) {
			this.sendNotification("RSS_FEED_UPDATE", { items: updatedItems });
		}

		this.rssItems = rssItems;
	},

	/* subscribedToFeed(feedUrl)
	 * Check if this module is configured to show this feed.
	 *
	 * attribute feedUrl string - Url of the feed to check.
	 *
	 * returns bool
	 */
	subscribedToFeed: function (feedUrl) {
		for (var f in this.config.feeds) {
			var feed = this.config.feeds[f];
			if (feed.url === feedUrl) {
				return true;
			}
		}
		return false;
	},

	/* titleForFeed(feedUrl)
	 * Returns title for a specific feed Url.
	 *
	 * attribute feedUrl string - Url of the feed to check.
	 *
	 * returns string
	 */
	titleForFeed: function (feedUrl) {
		for (var f in this.config.feeds) {
			var feed = this.config.feeds[f];
			if (feed.url === feedUrl) {
				return feed.title || "";
			}
		}
		return "";
	},

	/* scheduleUpdateInterval()
	 * Schedule visual update.
	 */
	scheduleUpdateInterval: function () {
		var self = this;

		self.updateDom(self.config.animationSpeed);

		// Broadcast RSSFeed if needed
		if (self.config.broadcastRSSFeeds) {
			self.sendNotification("RSS_FEED", { items: self.rssItems });
		}

		timer = setInterval(function () {
			self.activeItem++;
			self.updateDom(self.config.animationSpeed);

			// Broadcast RSSFeed if needed
			if (self.config.broadcastRSSFeeds) {
				self.sendNotification("RSS_FEED", { items: self.rssItems });
			}
		}, this.config.updateInterval);
	},

	/* capitalizeFirstLetter(string)
	 * Capitalizes the first character of a string.
	 *
	 * argument string string - Input string.
	 *
	 * return string - Capitalized output string.
	 */
	capitalizeFirstLetter: function (string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	resetDescrOrFullArticleAndTimer: function () {
		this.isShowingDescription = this.config.showDescription;
		this.config.showFullArticle = false;
		this.scrollPosition = 0;
		// reset bottom bar alignment
		document.getElementsByClassName("region bottom bar")[0].style.bottom = "0";
		document.getElementsByClassName("region bottom bar")[0].style.top = "inherit";
		if (!timer) {
			this.scheduleUpdateInterval();
		}
	},

	notificationReceived: function (notification, payload, sender) {
		Log.info(this.name + " - received notification: " + notification);
		if (notification === "ARTICLE_NEXT") {
			var before = this.activeItem;
			this.activeItem++;
			if (this.activeItem >= this.rssItems.length) {
				this.activeItem = 0;
			}
			this.resetDescrOrFullArticleAndTimer();
			Log.info(this.name + " - going from article #" + before + " to #" + this.activeItem + " (of " + this.rssItems.length + ")");
			this.updateDom(100);
		} else if (notification === "ARTICLE_PREVIOUS") {
			var before = this.activeItem;
			this.activeItem--;
			if (this.activeItem < 0) {
				this.activeItem = this.rssItems.length - 1;
			}
			this.resetDescrOrFullArticleAndTimer();
			Log.info(this.name + " - going from article #" + before + " to #" + this.activeItem + " (of " + this.rssItems.length + ")");
			this.updateDom(100);
		}
		// if "more details" is received the first time: show article summary, on second time show full article
		else if (notification === "ARTICLE_MORE_DETAILS") {
			// full article is already showing, so scrolling down
			if (this.config.showFullArticle === true) {
				this.scrollPosition += this.config.scrollLength;
				window.scrollTo(0, this.scrollPosition);
				Log.info(this.name + " - scrolling down");
				Log.info(this.name + " - ARTICLE_MORE_DETAILS, scroll position: " + this.config.scrollLength);
			}
			else {
				this.showFullArticle();
			}
		} else if (notification === "ARTICLE_SCROLL_UP") {
			if (this.config.showFullArticle === true) {
				this.scrollPosition -= this.config.scrollLength;
				window.scrollTo(0, this.scrollPosition);
				Log.info(this.name + " - scrolling up");
				Log.info(this.name + " - ARTICLE_SCROLL_UP, scroll position: " + this.config.scrollLength);
			}
		} else if (notification === "ARTICLE_LESS_DETAILS") {
			this.resetDescrOrFullArticleAndTimer();
			Log.info(this.name + " - showing only article titles again");
			this.updateDom(100);
		} else if (notification === "ARTICLE_TOGGLE_FULL") {
			if (this.config.showFullArticle) {
				this.activeItem++;
				this.resetDescrOrFullArticleAndTimer();
			} else {
				this.showFullArticle();
			}
		} else if (notification === "ARTICLE_INFO_REQUEST") {
			this.sendNotification("ARTICLE_INFO_RESPONSE", {
				title: this.rssItems[this.activeItem].title,
				source: this.rssItems[this.activeItem].sourceTitle,
				date: this.rssItems[this.activeItem].pubdate,
				desc: this.rssItems[this.activeItem].description,
				url: this.getActiveItemURL()
			});
		} else {
			Log.info(this.name + " - unknown notification, ignoring: " + notification);
		}
	},

	showFullArticle: function () {
		this.isShowingDescription = !this.isShowingDescription;
		this.config.showFullArticle = !this.isShowingDescription;
		// make bottom bar align to top to allow scrolling
		if (this.config.showFullArticle === true) {
			document.getElementsByClassName("region bottom bar")[0].style.bottom = "inherit";
			document.getElementsByClassName("region bottom bar")[0].style.top = "-90px";
		}
		clearInterval(timer);
		timer = null;
		Log.info(this.name + " - showing " + this.isShowingDescription ? "article description" : "full article");
		this.updateDom(100);
	}

});
