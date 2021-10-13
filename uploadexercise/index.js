const puppeteer = require("puppeteer");
const download = require('download');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');

module.exports = async function (context, req) {

    const username = process.env['stUser'];
    const password = process.env['stPassword'];
    const loginurl = process.env['stLoginUrl'] || "https://www.sports-tracker.com/login";
    const tmpfilepath = process.env['tmpfilepath'] || __dirname+"/files";
    const gpxUrl = req.query.gpxurl;
    const browser = await puppeteer.launch();
    const uploadStatus = 1;

    try {
        
        const page = await browser.newPage();
        await page.goto(loginurl, {waitUntil: 'networkidle2'});

        console.info('browser opened');

        await page.click('#onetrust-accept-btn-handler');

        console.info('cookies clicked');

        await page.waitForSelector('input[id=username]');
        await page.$eval('input[id=username]', (el, username) => {
            return el.value = username;
        }, username);

        await page.waitForSelector('input[id=password]');
        await page.$eval('input[id=password]', (el, password) => {
            return el.value = password;
        }, password);

        console.log('login filled');

        await page.waitForTimeout(2000);
        await page.click('.submit');
        await page.waitForTimeout(2000);

        console.info('logged in');

        await page.click('.add-workout');
        await page.waitForTimeout(2000);

        await page.waitForSelector('.import-button');
        await page.click('.import-button');
        await page.waitForTimeout(2000);

        var tmpfilename = uuid.v4();
        const filepath = path.join(tmpfilepath, tmpfilename+'.gpx');
        download(gpxUrl).pipe(fs.createWriteStream(filepath));
        await page.waitForTimeout(10000);

        console.info('exercise downloaded');

        const filename = path.basename(gpxUrl)
        console.info(filename);

        const fileExists = fs.existsSync(filepath);
        
        if(fileExists) {
            await page.waitForSelector('input[type=file]');
            await page.waitForTimeout(1000);

            const fileDropHandle = await page.$('input[type=file]');
            await fileDropHandle.uploadFile(filepath);

            await page.waitForTimeout(10000);

            console.info('gpx uploaded');

            await page.waitForSelector('button.save-button');
            let savebtn = 'button.save-button';
            await page.evaluate((savebtn) => document.querySelector(savebtn).click(), savebtn);
            await page.waitForTimeout(5000);

            console.info('exercise saved');
            
            fs.unlinkSync(filepath)
        }
        
    }
    catch(e) {
        console.error(e.message);
        uploadStatus = 0;
    }

    await browser.close();

    context.res = {
        body: {
            "status": uploadStatus
        },
        headers: {
            "content-type": "application/json"
        }
    };
};