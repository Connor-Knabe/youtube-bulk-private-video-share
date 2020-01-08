const Nightmare = require('nightmare');
const log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug';
var login = require('./login.js');

var nightmare = null;
logger.info('start');

main();
function main() {
	logger.info(new Date(), 'Logging into YouTube Studio to add users to private videos');
	nightmare = new Nightmare({ show: true });
	// var videos = [ 'videourl' ];
	nightmare
		.goto(login.youtubeUrl)
		.insert('#Email', login.email)
		.click('.rc-button.rc-button-submit')
		.wait('#Passwd')
		.insert('#Passwd', login.pass)
		.click('.rc-button.rc-button-submit')
		.wait('.page-title-container')
		.goto(login.youtubeVideo1)
		.wait('.yt-uix-form-input-textarea .metadata-share-contacts')
		.insert('.yt-uix-form-input-textarea .metadata-share-contacts', 'email@gmail.com')
		.then(() => {
			logger.info('Finished sharing private videos');
			// nightmare.end();
			// nightmare = null;
		})
		.catch((error) => {
			const errorTitle = 'Failed to share private videos';
			logger.error(errorTitle, error);
			// nightmare.end();
			// nightmare = null;
		})
		.then((_) => {
			logger.debug('Ending nightmare');
			nightmare.end();
			nightmare.proc.disconnect();
			nightmare.proc.kill();
			nightmare.ended = true;
			nightmare = null;
		});
}
