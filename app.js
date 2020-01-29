const Apify = require('apify');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');

// PARAMETERS GO HERE

        var licenceNumber = '' // Your License number
        var refNumber = '' // Your referance number
        var dateFrom = new Date('2020-02-02') // Date to check from
        var dateTo = new Date('2020-03-05') // Date to check To
        var timesWanted = [] // Make empty if any time ['9:54am', '10:51am', '12:18pm'] use this format (with am and pm and :)
        var sendEmailTo = 'John Doe yourEmail@gmail.com' // Email address where the email will be sent (you can use your gmail again and it will just look like you are sending yourself emails)
        var emailFrom = 'Driving Test Checker yourEmail@gmail.com' // Replace yourEmail@gmail.com with your Gmail Address.

        var gmailLoginUser = 'yourEmail@gmail.com' // Your Gmail address goes here.
        var googleAppPass = '' // Put the APP Password here. You can make one using this link: https://support.google.com/accounts/answer/185833?hl=en

/////////////

datesIwant = [] // array to hold the days that we want

Apify.main(async () => {

    var now = new Date()
    var hours = now.getHours();
    var mins = now.getMinutes();

    if (hours < 6 || (hours > 22 && mins > 39)) {
        await page.close();
        await browser.close();
    }

    const browser = await Apify.launchPuppeteer({});
    const page = await browser.newPage();
    await Apify.utils.puppeteer.hideWebDriver(page)

    await page.goto('https://driverpracticaltest.dvsa.gov.uk/login');

    //await page.screenshot({path: 'banned.png'});

    await page.type('#driving-licence-number', licenceNumber);
    await page.type('#application-reference-number', refNumber);
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
            if (timesWanted.length > 0) { // If checking times
                var timesAvaliable = dates[i].avaliableTimes; // Get avaliable times on this day
                for (j = 0; j < timesWanted.length; j++) { // For every time wanted
                    if (timesAvaliable.includes(timesWanted[j])) { // Check if the time is avaliable on the current day
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

    console.log(datesIwant)

    emailSent = await sendEmail();

    console.log(emailSent)

    await page.close();
    await browser.close();
});

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

            console.log(emailContent)
        } else {
            emailContent += '<h2>No Driving Test Avaliable</h2>';
            emailSubject = 'No Driving Test Avaliable :(';
        }

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: false,
            port: 25,
            auth: {
                user: gmailLoginUser,
                pass: googleAppPass
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        let mailOptions = {
            from: emailFrom,
            to: sendEmailTo,
            subject: emailSubject,
            html: emailContent
        }

        transporter.sendMail(mailOptions, function(err, res) {
            if (err) {
                console.log(err)
                resolve('Email Error')
            } else {
                resolve('Email Sent')
            }
        })
    })
}
