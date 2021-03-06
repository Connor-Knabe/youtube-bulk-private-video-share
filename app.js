const open = require('open');
const log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug';
const login = require('./login.js');
const videoFile = require('./video.js');
const options = require('./options.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// @ts-ignore
// puppeteer.use(StealthPlugin());
logger.info('start');

//debug
// openAllVideoLinks();

main(videoFile.youtubeVideos);

async function main(vids) {
	for (let vidNum = 0; vidNum < vids.length; vidNum += options.parallelBrowserCount) {
		var browsers = [];
		for (let browserNum = 0; browserNum < options.parallelBrowserCount; browserNum++) {
			var currentVideoNum = vidNum + browserNum;
			if (vids[currentVideoNum]) {
				browsers.push(addEmailsToVideo(vids[currentVideoNum], vidNum));
			}
		}
		await Promise.all(browsers).then((videoId) => {
			// logger.debug(`Successfully shared: ${videoId}`);
		});
	}

	if (vids && vids != undefined && vids.length > 0) {
		checkForRetry(vids);
	}
}

function checkForRetry(vids) {
	console.log('check fo retry', vids);

	if (vids && vids.length > 0) {
		var vidsNeedToRetry = vids.map((video) => {
			if (video && video.retryCount > 0 && video.retryCount < options.maxRetryCount) {
				return video;
			}
		});

		var vidsFailed = vids.map((video) => {
			if (video && video.retryCount > options.maxRetryCount) {
				return video;
			}
		});

		if (vidsFailed && vidsNeedToRetry[0] != undefined && vidsFailed.length > 0) {
			console.log('videos that have failed to retry', vidsFailed);
		}

		if (vidsNeedToRetry && vidsNeedToRetry[0] != undefined && vidsNeedToRetry.length > 0) {
			console.log('need to retry', vidsNeedToRetry);
			main(vidsNeedToRetry);
		}
	}
}

function addEmailsToVideo(vid, vidNum) {
	return new Promise(async (resolve, reject) => {
		const browser = await puppeteer.launch({ headless: options.disableBrowserWindow });
		var videoId = vid.videoId;
		try {
			// @ts-ignore

			var page = await browser.newPage();

			await page.goto(videoFile.youtubeUrl, { waitUntil: 'networkidle2' });

			await page.type('input[type="email"]', login.email);
			await page.type('body', '\u000d');
			await page.waitForNavigation();
			await page.waitFor(2000);
			await page.type('input[type="password"]', login.pass);
			await page.type('body', '\u000d');

			await page.waitForNavigation();

			await page.goto(`https://www.youtube.com/edit?video_id=${videoId}&nps=1`, { waitUntil: 'networkidle2' });

			await page.click('#video-overflow-menu');
			await page.waitFor(2000);
			await page.click('#text-item-2 > ytcp-ve > div > div > yt-formatted-string');
			await page.waitFor(2000);
			var pages = await browser.pages();
			page = pages[2];

			if (options.removeOnAdd) {
				await page.waitFor(6000);
				await page.waitFor('.sharing-dialog-remove-all-container.control-small-text');
				await page.click('.sharing-dialog-remove-all-container.control-small-text');
				await page.waitFor(1000);
				await page.click('.yt-uix-button.yt-uix-button-size-default.yt-uix-button-primary.sharing-dialog-button.sharing-dialog-ok');
				page = pages[1];

				await page.waitFor(500);

				await page.goto(`https://www.youtube.com/edit?video_id=${videoId}&nps=1`, { waitUntil: 'networkidle2' });
				await page.click('#video-overflow-menu');
				await page.waitFor(2000);
				await page.click('#text-item-2 > ytcp-ve > div > div > yt-formatted-string');
				await page.waitFor(2000);
				pages = await browser.pages();
				page = pages[2];
			}

			await page.waitFor('.yt-uix-form-input-textarea.metadata-share-contacts');
			await page.type('.yt-uix-form-input-textarea.metadata-share-contacts', videoFile.inputEmails);

			await page.waitFor(1000);

			if (options.disableEmailNotification) {
				await page.waitFor('.yt-uix-form-input-checkbox.notify-via-email');
				await page.click('.yt-uix-form-input-checkbox.notify-via-email');
			}

			await page.click('.yt-uix-button.yt-uix-button-size-default.yt-uix-button-primary.sharing-dialog-button.sharing-dialog-ok');
			await page.waitFor(5000);
			await browser.close();
			logger.debug(`Successfully shared: ${videoId}`);
			resolve(videoId);
		} catch (exception) {
			vid.retryCount++;
			await browser.close();
			var result = {
				error: exception,
				videoId: videoId
			};
			logger.error(`Failed sharing: ${result.videoId} with exception ${result.error}`);
			resolve(result);
		}
	});
}

function openAllVideoLinks() {
	videoFile.youtubeVideos.forEach((video) => {
		logger.info(`https://www.youtube.com/edit?video_id=${video.videoId}&nps=1`);
		open(`https://www.youtube.com/edit?video_id=${video.videoId}&nps=1`);
	});
}
