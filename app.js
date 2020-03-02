const open = require('open');
const log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug';
const login = require('./login.js');
const video = require('./video.js');
const options = require('./options.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// @ts-ignore
puppeteer.use(StealthPlugin());
logger.info('start');

//debug
// openAllVideoLinks();

main(video.youtubeVideos);

async function main(vids) {
	for (let vidNum = 0; vidNum < vids.length; vidNum += options.parallelBrowserCount) {
		var browsers = [];
		for (let browserNum = 0; browserNum < options.parallelBrowserCount; browserNum++) {
			var currentVideoNum = vidNum + browserNum;
			if (vids[currentVideoNum]) {
				browsers.push(addEmailsToVideo(vids[currentVideoNum]));
			}
		}
		await Promise.all(browsers)
			.then((videoId) => {
				logger.debug(`Successfully shared: ${videoId}`);
			})
			.catch((result) => {
				logger.error(`Failed sharing: ${result.videoId} with exception ${result.exception}`);
			});
	}

	if (vids.length > 1) {
		var vidsNeedToRetry = vids.map((video) => {
			if (video.retryCount > 0 && video.retryCount < 3) {
				return video;
			}
		});

		var vidsFailed = vids.map((video) => {
			if (video.retryCount > 3) {
				return video;
			}
		});

		if (vidsFailed.length > 1) {
			console.log('failed vids', vidsFailed);
		}

		main(vidsNeedToRetry);
	}
}

function addEmailsToVideo(video) {
	return new Promise(async (resolve, reject) => {
		const browser = await puppeteer.launch({ headless: options.disableBrowserWindow });
		var videoId = video.VideoId;

		try {
			// @ts-ignore
			const page = await browser.newPage();
			await page.goto(video.youtubeUrl, { waitUntil: 'networkidle2' });
			await page.type('input[type="email"]', login.email);
			await page.type('body', '\u000d');
			await page.waitForNavigation();
			await page.waitFor(2000);
			await page.type('input[type="password"]', login.pass);
			await page.type('body', '\u000d');
			await page.waitForNavigation();
			await page.goto(`https://www.youtube.com/edit?video_id=${videoId}&nps=1`, { waitUntil: 'networkidle2' });
			await page.waitFor('.yt-uix-form-input-textarea.metadata-share-contacts');
			await page.type('.yt-uix-form-input-textarea.metadata-share-contacts', video.inputEmails);
			if (options.disableEmailNotification) {
				await page.click('.yt-uix-form-input-checkbox.notify-via-email');
			}
			await page.waitFor(5000);
			await page.click('.yt-uix-button.yt-uix-button-size-default.yt-uix-button-primary.sharing-dialog-button.sharing-dialog-ok');
			await page.waitFor(5000);
			await browser.close();
			resolve(videoId);
		} catch (exception) {
			video.retryCount++;
			await browser.close();
			var result = {
				err: exception,
				videoId: videoId
			};
			reject(result);
		}
	});
}

function openAllVideoLinks() {
	video.youtubeVideos.forEach((videoId) => {
		logger.info(`https://www.youtube.com/edit?video_id=${videoId}&nps=1`);
		open(`https://www.youtube.com/edit?video_id=${videoId}&nps=1`);
	});
}
