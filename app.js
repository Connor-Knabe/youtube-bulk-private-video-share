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

main();
async function main() {
	for (let vidNum = 0; vidNum < video.youtubeVideoIds.length; vidNum += options.parallelBrowserCount) {
		var browsers = [];
		for (let browserNum = 0; browserNum < options.parallelBrowserCount; browserNum++) {
			var currentVideoNum = vidNum + browserNum;
			if (video.youtubeVideoIds[currentVideoNum]) {
				browsers.push(addEmailsToVideo(video.youtubeVideoIds[currentVideoNum]));
			}
		}
		await Promise.all(browsers)
			.then((videoId) => {
				logger.debug(`Successfully shared: ${videoId}`);
			})
			.catch((result) => {
				logger.error(`Failed sharing: ${result.videoId}`);
			});
	}
}

function addEmailsToVideo(videoId) {
	return new Promise(async (resolve, reject) => {
		// logger.info('Processing video url: ', videoId);
		// logger.info(new Date(), 'Logging into YouTube Studio to add users to private videos');
		const browser = await puppeteer.launch({ headless: options.disableBrowserWindow });

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
	video.youtubeVideoIds.forEach((videoId) => {
		logger.info(`https://www.youtube.com/edit?video_id=${videoId}&nps=1`);
		open(`https://www.youtube.com/edit?video_id=${videoId}&nps=1`);
	});
}
