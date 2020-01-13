# youtube-bulk-private-video-share
share multiple private youtube videos to multiple email addresses easily

1) fill out loginExample.js with a YouTube email address that has access to the videos you want to share
2) rename loginExample.js to login.js
3) fill out videoExample.js with the emails you want to have access to the private videos (inputEmails)
4) youtubeurl is your youtube studio channel url
5) youtubeVideoIds is an array of the videoIds you want to share
6) rename videoExample.js to video.js
7) run the program by typing node app.js

options:
* parallelBrowserCount -> number of browsers to open (the higher the number the quicker this will finish but also more RAM will be used)
* disableEmailNotification -> set to true to not send email notifications for shared video
* disableBrowserWindow -> don't show the browser window 
