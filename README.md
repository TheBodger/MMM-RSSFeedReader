# Module: RSS feed reader
The `MMM-RSSFeedReader ` module is a module for the MagicMirror2 system.
This module displays RSS details based on a RSS feed that meets RSS 2.0 or ATOM formats, including title, age of post, an image if present and author and summary details about the post. Scrolling through RSS posts happens happens time-based (````updateInterval````), but can also be controlled by sending specific notifications to the module.

Requires: 
	htmlparser2 (npm install htmlparser2)<br>
	feedMe (npm install feedMe)

This uses the core code developed for the MM2 default module NewsFeed:

thanks to By Michael Teeuw http://michaelteeuw.nl who created this as part of the MM2 ecosystem.

## Screenshot
- RSS feed reader Screenshot using Elle magazine RSS 2.0 feed (https://www.elle.com/rss/all.xml/)
![RSS feed reader Screenshot](RSSFeedReader_screenshot.png)

## Using the module

### Configuration
To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: "mmm-RSSfeedreader",
		position: "top_center",	// This can be any of the regions. Best results in center regions.
		config: {
			// The config property is optional.
			// If no config is set, an example feed is shown based on the default configuration settings below.
			// See 'Configuration options' for more information.

			feeds: [
				{
					title: "Elle Magazine",
					url: "https://www.elle.com/rss/all.xml/",
				},
				{
					title: "GQ for Men",
					url: "https://www.gq.com/feed/style/rss",
				},
			]
		}
	}
]
````

### Notifications
#### Interacting with the module
MagicMirror's [notification mechanism](https://github.com/MichMich/MagicMirror/tree/master/modules#thissendnotificationnotification-payload) allows to send notifications to the `mmm-RSSfeedreader` module. The following notifications are supported:

| Notification Identifier | Description
| ----------------------- | -----------
| `ARTICLE_NEXT`          | Shows the next RSS post (hiding the summary or previously fully displayed article)
| `ARTICLE_PREVIOUS`      | Shows the previous RSS post (hiding the summary or previously fully displayed article)
| `ARTICLE_MORE_DETAILS`  | When received the _first time_, shows the corresponding description of the currently displayed RSS post. <br> The module expects that the module's configuration option `showDescription` is set to `false` (default value). <br><br> When received a _second consecutive time_, shows the full RSS article in an IFRAME. <br> This requires that the RSS page can be embedded in an IFRAME, e.g. doesn't have the HTTP response header [X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options) set to e.g. `DENY`.<br><br>When received the _next consecutive times_, reloads the page and scrolls down by `scrollLength` pixels to paginate through the article.
| `ARTICLE_LESS_DETAILS`  | Hides the summary or full RSS post and only displays the RSS post of the currently viewed RSS post.
| `ARTICLE_TOGGLE_FULL`   | Toggles article in fullscreen.
| `ARTICLE_INFO_REQUEST`  | Causes `mmm-RSSfeedreader` to respond with the notification `ARTICLE_INFO_RESPONSE`, the payload of which provides the `title`, `source`, `date`, `desc` and `url` of the current RSS post.

#### Notifications sent by the module
MagicMirror's [notification mechanism](https://github.com/MichMich/MagicMirror/tree/master/modules#thissendnotificationnotification-payload) can also be used to send notifications from the current module to all other modules. The following notifications are broadcasted from this module:

| Notification Identifier | Description
| ----------------------- | -----------
| `NEWS_FEED`             | Broadcast the current list of RSS feeds loaded.
| `NEWS_FEED_UPDATE`      | Broadcasts the list of updated RSS feeds.

Note the payload of the sent notification event is ignored.

#### Example
The following example shows how the next RSS feed title can be displayed on the MagicMirror.
````javascript
this.sendNotification('ARTICLE_NEXT');
````

#### `mmm-RSSfeedreader` specific notification emitting modules
The third party [MMM-Gestures](https://github.com/thobach/MMM-Gestures) module supports above notifications when moving your hand up, down, left or right in front of a gesture sensor attached to the MagicMirror. See module's readme for more details.

## Configuration options

The following properties can be configured:

| Option             | Description
| ------------------ | -----------
| `feeds`            | An array of RSS feed urls that will be used as source. <br> More info about this object can be found below. <br> **Default value:** `[{title: "Elle",url: "https://www.elle.com/rss/all.xml/",encoding: "UTF-8" //ISO-8859-1 }]`<br>You can add `reloadInterval` option to set particular reloadInterval to a feed.
| `showSourceTitle`  | Display the title of the feed. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `showPublishDate`  | Display the publish date or last update date of the feed. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `broadcastRSSFeeds`   | Gives the ability to broadcast RSS feeds to all modules, by using ```sendNotification()``` when set to `true`, rather than ```sendSocketNotification()``` when `false` <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `broadcastRSSUpdates`   | Gives the ability to broadcast RSS feed updates to all modules <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `showDescription`  | Display the description of a post. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `false`
| `wrapTitle`        | Wrap the title of the post to multiple lines. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `wrapDescription`  | Wrap the description of the post to multiple lines. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `truncDescription` | Truncate description? <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `lengthDescription`| How many characters to be displayed for a truncated description? <br><br> **Possible values:** `1` - `500` <br> **Default value:** `400`
| `hideLoading`      | Hide module instead of showing LOADING status. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `false`
| `reloadInterval`   | How often does the feed needs to be fetched? (Milliseconds) <br><br> **Possible values:** `1000` - `86400000` <br> **Default value:** `300000` (5 minutes)
| `updateInterval`   | How often do you want to display a new post? (Milliseconds) <br><br> **Possible values:**`1000` - `60000` <br> **Default value:** `10000` (10 seconds)
| `animationSpeed`   | Speed of the update animation. (Milliseconds) <br><br> **Possible values:**`0` - `5000` <br> **Default value:** `2500` (2.5 seconds)
| `maxRSSItems`     | Total amount of RSS posts to cycle through. (0 for unlimited) <br><br> **Possible values:**`0` - `...` <br> **Default value:** `0`
| `ignoreOldItems`   | Ignore RSS posts that are outdated. <br><br> **Possible values:**`true` or `false` <br> **Default value:** `false`
| `ignoreOlderThan`  | How old should RSS posts be before they are considered outdated? (Milliseconds) <br><br> **Possible values:**`1` - `...` <br> **Default value:** `86400000` (1 day)
| `removeStartTags`  | Some RSS feeds feature tags at the **beginning** of their titles or descriptions, such as _[VIDEO]_. This setting allows for the removal of specified tags from the beginning of an item's description and/or title. <br><br> **Possible values:**`'title'`, `'description'`, `'both'`
| `startTags`        | List the tags you would like to have removed at the beginning of the post <br><br> **Possible values:** `['TAG']` or `['TAG1','TAG2',...]`
| `removeEndTags`    | Remove specified tags from the **end** of a post's description and/or title. <br><br> **Possible values:**`'title'`, `'description'`, `'both'`
| `endTags`          | List the tags you would like to have removed at the end of the feed item <br><br> **Possible values:** `['TAG']` or `['TAG1','TAG2',...]`
| `prohibitedWords` | Remove RSS feed post if one of these words is found anywhere in the title (case insensitive and greedy matching) <br><br> **Possible values:** `['word']` or `['word1','word2',...]` `TODO - replace with bad words checking`
| `scrollLength` | Scrolls the full RSS article page by a given number of pixels when a `ARTICLE_MORE_DETAILS` notification is received and the full RSS article is already displayed.<br><br> **Possible values:** `1` or `10000` <br> **Default value:** `500`
| `logFeedWarnings` | Log warnings when there is an error parsing a RSS article. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `false`
<br><br>
| `Additional config options that are under development, partilly or fully implemented unless flagged as TODO`|
<br><br>
| `ignoreCategories` | check categorie(s) of a post match the list below and ignore them (case insensitive match so enter in lower case only in the list) <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `ignoreCategoryList` | List of categories to try and match against to stop a post being displayed <br><br> **Possible values:** a list of categories <br> **Default value:** `["horoscopes"]`
| `showImage` | Will show any extracted image from the post. Depending on the type of the feed (RSS 2.0/ATOM) different processing is used to find a potential usable image <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `maxImageWidth` | Will be used to resize an image to fit this width, keeping the original ratio <br><br> **Possible values:** Any valid CSS absolute size measurement <br> **Default value:** `'400px'`
| `maxImageHeight` | After resizing, will be used to crop the image to this height. Currently, this will also force the post details to appear at this height below the top of the image regardless of the height of the image. Experiment to get the best fit for your MM2 <br><br> **Possible values:** Any valid CSS absolute size measurement <br> **Default value:** `'600px'`
| `processContentForImages` | Will look inside all RSS content to try and find an image. See the code for details<br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `showVersion` | TODO Will show the RSS Feed type in the header including unrecognised versions<br><br> **Possible values:** `true` or `false` <br> **Default value:** `false`
| `debugToMM` | TODO Will Will show detailed information from the feed processing to the module area on the screen - <br><br> **Possible values:** `true` or `false` <br> **Default value:** `false`
| `constrainModuleWidth` | forces the module to a fixed width within the requested region - <br><br> **Possible values:** `true` or `false` <br> **Default value:** `false`
| `maxModuleWidth` | if the module is constrained in its width this is the width applied - <br><br> **Possible values:** any valid absolute CSS 3 measurement<br> **Default value:** `600px`

The `feeds` property contains an array with multiple objects. These objects have the following properties:

| Option     | Description
| ---------- | -----------
| `title`    | The name of the feed source to be displayed above the RSS posts. <br><br> This property is optional.
| `url`      | The `HTTPS` url of the feed used. <br><br> **Example:** `'https://www.nytimes.com/services/xml/rss/nyt/HomePage.xml'` <br><br>The Module will only read feeds from a secure website (HTTPS)<br><br> A good source of usable and maintained feeds is https://www.feedspot.com/ which has 1000s of feeds listed for almost any subject you can think of.
| `encoding` | The encoding of the RSS feed. <br><br> This property is optional. <br> **Possible values:**`'UTF-8'`, `'ISO-8859-1'`, etc ... <br> **Default value:** `'UTF-8'`

Licensed under MIT Licence terms, see LICENSE file.
