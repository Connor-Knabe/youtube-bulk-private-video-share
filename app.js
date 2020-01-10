const log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug';
var login = require('./login.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// @ts-ignore
puppeteer.use(StealthPlugin());

logger.info('start');

var numberOfBrowsersInParallel = 4;

main();
async function main() {
	for (let vidNum = 0; vidNum < login.youtubeVideos.length; vidNum += numberOfBrowsersInParallel) {
		var browsers = [];

		for (let browserNum = 0; browserNum < numberOfBrowsersInParallel; browserNum++) {
			var currentVideoNum = vidNum + browserNum;
			if (login.youtubeVideos[currentVideoNum]) {
				// logger.debug('currentVid num', currentVideoNum);
				browsers.push(addEmailsToVideo(login.youtubeVideos[currentVideoNum]));
				// browsers.push(login.youtubeVideos[currentVideoNum]);
			}
		}

		await Promise.all(browsers);
	}
}

function addEmailsToVideo(videoUrl) {
	return new Promise(async (resolve, reject) => {
		logger.info('video url', videoUrl);

		logger.info(new Date(), 'Logging into YouTube Studio to add users to private videos');
		// var videos = [ 'videourl' ];
		// @ts-ignore
		const browser = await puppeteer.launch({ headless: false }); // default is true
		const page = await browser.newPage();
		await page.goto(login.youtubeUrl, { waitUntil: 'networkidle2' });
		await page.type('input[type="email"]', login.email);
		await page.type('body', '\u000d');
		await page.waitForNavigation();
		// await page.waitFor('input[type="password"]');
		await page.waitFor(5000);
		await page.type('input[type="password"]', login.pass);
		await page.type('body', '\u000d');
		await page.waitForNavigation();
		await page.goto(videoUrl, { waitUntil: 'networkidle2' });
		// await page.waitForNavigation();
		await page.waitFor('.yt-uix-form-input-textarea.metadata-share-contacts');
		await page.type('.yt-uix-form-input-textarea.metadata-share-contacts', login.inputEmail);
		await page.click('.yt-uix-button.yt-uix-button-size-default.yt-uix-button-primary.sharing-dialog-button.sharing-dialog-ok');
		await page.waitFor('.yt-dialog-waiting-content');
		await browser.close();
		resolve();
	});
}
