const puppeteer = require("puppeteer-extra");
const download = require('download');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');

// require executablePath from puppeteer
const { executablePath } = require('puppeteer')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

module.exports = async function (context, req) {

    const username = process.env['stUser'];
    const password = process.env['stPassword'];
    const loginurl = process.env['stLoginUrl'] || "https://www.sports-tracker.com/login";
    const tmpfilepath = process.env['tmpfilepath'] || __dirname + "/files";
    const gpxUrl = req.query.gpxurl;
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: executablePath(),
    });
    let uploadStatus = 1;

    try {
        context.log('starting browser');
        
        const page = await browser.newPage();
        await page.goto(loginurl, { waitUntil: 'networkidle2' });

        context.log('browser opened');

        await page.click('#onetrust-accept-btn-handler');

        context.log('cookies clicked');

        await page.waitForSelector("iframe")
        const elementHandle = await page.$("#recaptcha-container > div > div > iframe")
        const iframe = await elementHandle.contentFrame()

        //now iframe is like "page", and to click in the button you can do this
        await iframe.click("#recaptcha-anchor > div.recaptcha-checkbox-border")
        //or
        await iframe.evaluate(() => {
            document.querySelector("#recaptcha-anchor > div.recaptcha-checkbox-border").click()
        })

        context.log('recaptcha clicked');
        await delay(2000);

        await page.waitForSelector('input[id=username]');
        await page.$eval('input[id=username]', (el, username) => {
            return el.value = username;
        }, username);

        await page.waitForSelector('input[id=password]');
        await page.$eval('input[id=password]', (el, password) => {
            return el.value = password;
        }, password);

        context.log('login filled');

        await delay(5000);

        await page.click('.submit');
        await delay(12000);

        context.log('logged in');

        await page.waitForSelector('.add-workout');

        await page.click('.add-workout');
        await delay(2000);

        await page.waitForSelector('.import-button');
        await page.click('.import-button');
        await delay(2000);

        var tmpfilename = uuid.v4();
        const filepath = path.join(tmpfilepath, tmpfilename + '.gpx');
        download(gpxUrl).pipe(fs.createWriteStream(filepath));
        await delay(10000);

        context.log('exercise downloaded');

        const filename = path.basename(gpxUrl)
        context.log(filename);

        const fileExists = fs.existsSync(filepath);

        if (fileExists) {
            await page.waitForSelector('input[type=file]');
            await delay(2000);

            const fileDropHandle = await page.$('input[type=file]');
            await fileDropHandle.uploadFile(filepath);

            await delay(10000);

            context.log('gpx uploaded');

            await page.waitForSelector('button.save-button');
            let savebtn = 'button.save-button';
            await page.evaluate((savebtn) => document.querySelector(savebtn).click(), savebtn);
            await delay(5000);

            context.log('exercise saved');

            fs.unlinkSync(filepath)
        }

    }
    catch (e) {
        context.log.error(e.message);
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