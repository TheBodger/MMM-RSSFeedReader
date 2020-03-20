/* Magic Mirror
 * Fetcher
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * Additional Capability: N Scott
 * MIT Licensed.
 */

/*
 * renamed all News/news/NEWS to RSS/rss/RSS
 */

var FeedMe = require("feedme");
var request = require("request");
var iconv = require("iconv-lite");

//needs htmlparser2 to pull images out of ATOM rss feed content

/* Fetcher
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * attribute RSSurl string - URL of the rss feed.
 * attribute reloadInterval number - Reload interval in milliseconds.
 * attribute logFeedWarnings boolean - Log warnings when there is an error parsing a rss article.
 */

var Fetcher = function (RSSurl, reloadInterval, encoding, logFeedWarnings, ignoreCategories, ignoreCategoryList) {
	var self = this;
	if (reloadInterval < 1000) {
		reloadInterval = 1000;
	}

	var reloadTimer = null;
	var items = [];

	var fetchFailedCallback = function() {};
	var itemsReceivedCallback = function () { };

	/* private methods */

	/* fetchRSS()
	 * Request the new items.
	 */

	const https = require('https');

	//https.get(RSSurl, (res) => {
	//	let parser = new FeedMe(true);
	//	res.pipe(parser);
	//	parser.on('end', () => {
	//		console.log(parser.done());
	//	});
	//});

	var fetchRSS = function() {
		clearTimeout(reloadTimer);
		reloadTimer = null;
		items = [];

		var feedType = "Unknown"

		https.get(RSSurl, (res) => {
			if (res.statusCode != 200) {
				console.error(new Error(`status code ${res.statusCode}`));
				return;
			}
			let parser = new FeedMe();
			parser.on('type', (type) => {
				feedType = type;
				//console.log('type of feed is', type);
			});
			parser.on('title', (title) => {
				//console.log('title of feed is', title);
			});
			parser.on('link', (link) => {
				//console.log('link of feed is', link);
			});
			parser.on('description', (description) => {
				//console.log('description of feed is', description);
			});
			parser.on('updated', (updated) => {
				//console.log('feed updated ', updated);
			});
			parser.on('copyright', (copyright) => {
				//console.log('copyright of feed is', copyright);
			});
			parser.on('author', (author) => {
				//console.log('author of feed is', author);
			});
			res.pipe(parser);
		});

		var parser = new FeedMe();

		parser.on("item", function (item) {

			/* 
			 this is where we should be able to dissect the incoming XML page
			 from the Feed provider, using the version of xml provided
			 assuming initially that this will be version 2
			 */

			var imageUrl = "";
			var imageWidth = "";

			if (feedType.toLowerCase() == "atom") {

				//<? xml version = "1.0" encoding = "utf-8" ?>
				//	<feed xmlns="http://www.w3.org/2005/Atom">

				//		<title>Example Feed</title>
				//		<link href="http://example.org/" />
				//		<updated>2003-12-13T18:30:02Z</updated>
				//		<author>
				//			<name>John Doe</name>
				//		</author>
				//		<id>urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6</id>

				//		<entry>
				//			<title>Atom-Powered Robots Run Amok</title>
				//			<link href="http://example.org/2003/12/13/atom03" />
				//			<id>urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a</id>
				//			<updated>2003-12-13T18:30:02Z</updated>
				//			<summary>Some text.</summary>
				//		</entry>

				//	</feed>
				var guid = item.id || "";
				var title = item.title;
				var pubdate = item.pubdate || item.published || item.updated || item["dc:date"];

				var description = item.description || item.summary || "";

				var author = item.author.name || "";

				description = description || "Submitted by " + author;

				var url = item.url || item.link.href || "";

				imageUrl = getMeHTMLImages(item.content);
				//console.log(imageUrl);

				var image = item.image || imageUrl || "";
				var imageSize = imageWidth || "";
				var category = item.category.term || "";

				var copyright = item.rights || "";

				if (title && pubdate) {

					if (!ignoreCategories || (ignoreCategories && ignoreCategoryList.indexOf(category.toLowerCase()) == -1)) {

						var regex = /(<([^>]+)>)/ig;
						description = description.toString().replace(regex, "");

						//console.log("rssfeed ###: " + description);

						items.push({
							title: title,
							description: description,
							pubdate: pubdate,
							url: url,
							image: image,
							imageSize: imageSize,
							guid: guid,
							category: category,
							author: author,
							copyright: copyright,
						});
					};

				} else if (logFeedWarnings) {
					console.log("Can't parse feed item:");
					console.log(item);
					console.log("Title: " + title);
					console.log("Description: " + description);
					console.log("Pubdate: " + pubdate);
				}

			}
			else if (feedType.toLowerCase() == "rss 2.0") {

				if (!(item['media:content'] == null)) {
					imageUrl = item['media:content'].url;
					imageWidth = item['media:content'].width;
				}

				if (!(item['media:thumbnail'] == null)) {
					imageUrl = item['media:thumbnail'].url;
					imageWidth = item['media:thumbnail'].width;
				}

				//need to add badwords here

				var title = item.title;
				var description = item.description || item.summary || item.content || "";
				var pubdate = item.pubdate || item.published || item.updated || item["dc:date"];
				var url = item.url || item.link || "";
				var image = item.image || imageUrl || "";
				var imageSize = imageWidth || "";
				var category = item.category || "";
				var guid = item.guid || "";
				var author = "";
				var copyright = item.copyright || "";

				if (title && pubdate) {

					if (!ignoreCategories || (ignoreCategories && ignoreCategoryList.indexOf(category.toLowerCase()) == -1)) {

						var regex = /(<([^>]+)>)/ig;
						description = description.toString().replace(regex, "");

						//console.log("rssfeed ###: " + description);

						items.push({
							title: title,
							description: description,
							pubdate: pubdate,
							url: url,
							image: image,
							imageSize: imageSize,
							guid: guid,
							category: category,
							author: author,
							copyright: copyright,
						});
					};

				} else if (logFeedWarnings) {
					console.log("Can't parse feed item:");
					console.log(item);
					console.log("Title: " + title);
					console.log("Description: " + description);
					console.log("Pubdate: " + pubdate);
				}
			} //end of RSS version 2 processing
			else {

				//unknown feed type
				console.log(`Can't parse feed from: ${RSSurl}`);
				console.log(`Can't parse feed item: unknown feed type: ${feedType}`);
				console.log("Title: " + title);
				console.log("Description: " + description);
				console.log("Pubdate: " + pubdate);

			}
		});

		parser.on("end",	function() {
			console.log("end parsing - " + RSSurl);
			self.broadcastItems();
			scheduleTimer();
		});

		parser.on("error", function(error) {
			fetchFailedCallback(self, error);
			scheduleTimer();
		});

		nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
		headers =	{"User-Agent": "Mozilla/5.0 (Node.js "+ nodeVersion + ") MagicMirror/"	+ global.version +	" (https://github.com/MichMich/MagicMirror/)",
			"Cache-Control": "max-age=0, no-cache, no-store, must-revalidate",
			"Pragma": "no-cache"};

		request({uri: RSSurl, encoding: null, headers: headers})
			.on("error", function(error) {
				fetchFailedCallback(self, error);
				scheduleTimer();
			})
			.pipe(iconv.decodeStream(encoding)).pipe(parser);

	};

	var checkURL = function (imgurl) {
		const regex = /\.(jpeg|jpg|gif|png|bmp|tiff)$/;
		//console.log(imgurl);
		//console.log(imgurl.match(regex));
		return (imgurl.match(regex) != null);
	};

	var getMeHTMLImages = function (content) {

		//give precedence to images in address links

		const htmlparser2 = require("htmlparser2");

		//console.log('---------------------------------------------------------------------------------------------');
		//console.log(content);

		var imageURL = "";
		var imageLinkURL = "";

		const parser = new htmlparser2.Parser(
			{
				onopentag(name, attribs) {
					//console.log(name);
					//console.log(attribs);
					if (name === "img") {
						imageURL = (attribs.src);
					}
					else if (name == "a") {
						//console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>");
						if (checkURL(attribs.href)) { imageLinkURL = (attribs.href); };
					}
				},

				ontext(text) {
					//console.log("-->", text);
				},
				onclosetag(tagname) {
					if (tagname === "script") {
						//console.log("That's it?!");
					}
				}
			},
			{ decodeEntities: true }
		);
		parser.write(content);
			
		parser.end();

		if (imageLinkURL == "") { return imageURL } else { return imageLinkURL };

	};

	/* scheduleTimer()
	 * Schedule the timer for the next update.
	 */

	var scheduleTimer = function() {
		//console.log('Schedule update timer.');
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function() {
			fetchRSS();
		}, reloadInterval);
	};

	/* public methods */

	/* setReloadInterval()
	 * Update the reload interval, but only if we need to increase the speed.
	 *
	 * attribute interval number - Interval for the update in milliseconds.
	 */
	this.setReloadInterval = function(interval) {
		if (interval > 1000 && interval < reloadInterval) {
			reloadInterval = interval;
		}
	};

	/* startFetch()
	 * Initiate fetchRSS();
	 */
	this.startFetch = function() {
		fetchRSS();
	};

	/* broadcastItems()
	 * Broadcast the existing items.
	 */
	this.broadcastItems = function() {
		if (items.length <= 0) {
			//console.log('No items to broadcast yet.');
			return;
		}
		//console.log('Broadcasting ' + items.length + ' items.');
		itemsReceivedCallback(self);
	};

	this.onReceive = function(callback) {
		itemsReceivedCallback = callback;
	};

	this.onError = function(callback) {
		fetchFailedCallback = callback;
	};

	this.RSSurl = function() {
		return RSSurl;
	};

	this.items = function() {
		return items;
	};
};

module.exports = Fetcher;

