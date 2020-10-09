const Apify = require('apify');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const fs = require('fs');


var details = JSON.parse(fs.readFileSync("details.json"));
var dateFrom = new Date(details.dateFrom);
var dateTo = new Date(details.dateTo);

datesIwant = [] // array to hold the days that we want
var lastEmailContent = '';

const { log } = Apify.utils;
log.setLevel(log.LEVELS.ERROR);

Apify.main(async () => {

    var now = new Date()
    var hours = now.getHours();
    var mins = now.getMinutes();

    if (hours < 6 || (hours > 22 && mins > 39)) {
        console.info("Out of working hours!");
        return;
    }

    const browser = await Apify.launchPuppeteer({
        stealth: true,
        useChrome: true
    });
    const page = await browser.newPage();

    await page.goto('https://driverpracticaltest.dvsa.gov.uk/login');

    //await page.screenshot({path: 'banned.png'});
    await page.waitFor('#driving-licence-number'); // wait for the queueit
    await page.type('#driving-licence-number', details.licenceNumber);
    await page.type('#application-reference-number', details.refNumber);
    await page.click('#booking-login'); // Click Login

    await page.click('#date-time-change'); // Click Change date
    await page.click('#test-choice-earliest'); // Click show earliest radio button
    await page.click('#driving-licence-submit'); // Click continue
    await page.waitFor('tbody'); // Wait for full tbody to load
    const html = await page.content(); // Get HTML of page.

    const $ = cheerio.load(html) // Load it into cheerio

    var dates = []; // Array to hold all avaliable dates (not in our range yet this will be done later)

    $('.SlotPicker-day').each(function() { // For every avaliable day

        var day = { // Create object
            date: $('.SlotPicker-dayTitle', this).text(),
            dateInFormat: null,
            avaliableTimes: null
        }

        var times = []; // Array to hold the avaliable times on that day
        var id = $(this).attr('id'); // ID attribute for this day

        $('#' + id + ' label strong').each(function() { // For every time
            var dateInFormat = id.replace('date-', ''); // For some reason this only works inside here (problem with undefined id var)
            day.dateInFormat = dateInFormat; // get the date in correct format (for only getting range later)
            times.push($(this).text()) // push into object
        })

        day.avaliableTimes = times; // push times array into object
        dates.push(day) // push day object into dates array.
    })

    dates.splice(0, 1); // Remove first object (for some reason the website keeps days that are in the past?????)
    for (i = 0; i < dates.length; i++) { // For every avaliable day
        var date = new Date(dates[i].dateInFormat) // create a date object from that days date format
        if ((date > dateFrom) && (date < dateTo)) { // If its within our range
            if (details.timesWanted.length > 0) { // If checking times
                var timesAvaliable = dates[i].avaliableTimes; // Get avaliable times on this day
                for (j = 0; j < details.timesWanted.length; j++) { // For every time wanted
                    if (timesAvaliable.includes(details.timesWanted[j])) { // Check if the time is avaliable on the current day
                        datesIwant.push(dates[i]) // If it is push it in
                        break; // No need to continue checking once one is found
                    }
                }
            } else {
                datesIwant.push(dates[i]) // push it into the array.
            }
        }
    }

    // We now have an array with just the avaliable days that we want that are within our given range
    //console.log(datesIwant)

    console.log('');
    if (datesIwant.length > 0) {
        console.log("Slot Found!");
        for (i = 0; i < datesIwant.length; i++) { // Pretty Console print out of times.
            console.log(datesIwant[i].date)
            for (j = 0; j < datesIwant[i].avaliableTimes.length; j++) {
                console.log('   ' + datesIwant[i].avaliableTimes[j])
            }
        }
    } else {
        console.log('No Driving Test Avaliable :(')
    }

    // Notification. Feel free to change it to Slack Notification
    lastEmailContent = await getLastEmail()
    emailSent = await sendEmail();

    await page.close();
    await browser.close();
});

function getLastEmail() {
    return new Promise(resolve => {
       fs.readFile("lastEmailSentContents.txt", "utf-8", function(err, lastEmailSentContents) {
           resolve(lastEmailSentContents);
       });
   })
}

function getFormattedDate(date) {
    var dateDay = date.getDate()
    var dateMonth = date.getMonth() + 1
    var dateYear = date.getFullYear()
    if (dateDay < 10) {
        dateDay = '0' + dateDay;
    }
    if (dateMonth < 10) {
        dateMonth = '0' + dateMonth;
    }
    return dateDay + '/' + dateMonth + '/' + dateYear
}

function sendEmail() {
    return new Promise(resolve => {
        var emailContent = '';
        var emailSubject = '';

        if (datesIwant.length > 0) {

            emailSubject = 'A Driving test date with your parameters is avaliable!';
            emailContent += '<ul>'

            for (i = 0; i < datesIwant.length; i++) {

                timesAvaliable = datesIwant[i].avaliableTimes

                emailContent += '<li>'
                emailContent += datesIwant[i].date
                emailContent += '</li>'
                emailContent += '<ul>'

                for (j = 0; j < timesAvaliable.length; j++) {
                    emailContent += '<li>'
                    emailContent += timesAvaliable[j];
                    emailContent += '</li>'
                }
                emailContent += '</ul>'
            }
            emailContent += '</ul>'
            fs.writeFile("lastEmailSentContents.txt", emailContent, (err) => {
              if (err) console.log(err);
              console.log("Successfully Wrote Email Content to File.");
            });
        } else {
            emailSubject = 'No Driving Test Avaliable';
            emailContent += '<h4>A Driving Test was not found using your current parameters of:</h4>';

            emailContent = emailContent + '\n<p>Between ' + getFormattedDate(dateFrom) + ' and ' + getFormattedDate(dateTo) + '</p>'
            emailContent = emailContent + '\n<p>Only times avaliable of ' + details.timesWanted + '</p>'
        }

        if (emailContent == lastEmailContent) { // If copy of the last email sent add COPY to the end of the subject
            emailSubject += ' COPY'
        }

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: false,
            port: 25,
            auth: {
                user: details.gmailLoginUser,
                pass: details.googleAppPass
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        let mailOptions = {
            from: details.emailFrom,
            to: details.sendEmailTo,
            subject: emailSubject,
            html: emailContent
        }

        transporter.sendMail(mailOptions, function(err, res) {
            if (err) {
                console.log(err)
                resolve('Email Error')
            } else {
                resolve('Email Sent Successfully')
            }
        })
    })
}
