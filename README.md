# DEFUNCT UKDrivingTestCancellationChecker Node.JS
Checks the Gov Driving Test Website for a test date within a certain range of dates and times.

There are a few parameters that need to be changed within the details.json file before this will work for you.

Firstly you need to add in your license number and referance number.

Next you will need to specify the dates from and to that you want the application to flag tests for. USE THE FORMAT ALREADY IN THE FILE.

This app also allows you to only flag test dates that have specific times avaliable. For example you may want a test date somewhere between the 2nd of feburary and the 5th of march but you only want a test at either 10:51am or 9:54am. 

To do this you would have in your details JSON file:

        dateFrom : "2020-02-02",
        dateTo : "2020-03-05",
        timesWanted : ["10:51am", "9:54am"]
        
Next you will need to set the email address of where you want the emails to be sent to.

You will also need to set the email address and name of the address the email will be sent from. (this will just be your gmail address, the name however can be whatever you want.

Next you will need to set your gmail login. Again this will just be the gmail address of the account you want to use.

Finally you will need to generate a application password for the app. This is basically a password for just this app and essentially makes it so you don't have to put your actual google password.

A walk though of how to generate a google app password can be found here: https://support.google.com/accounts/answer/185833?hl=en

This app should now work for you once these have all been set. To launch the app use the batch file that I have provided.

To make this app automatically launch and check for test dates you can use windows built in task scheduler and set it up to execute the batch file every x minutes (I've got mine to check every 15m).

An tutorial of how to use windows task scheduler can be found here: https://www.digitalcitizen.life/how-create-task-basic-task-wizard

# Dependencies.

You will need to install the following things:

        Node.JS : https://nodejs.org/en/
        
And the following Node.JS NPM Modules:

        Apify : https://www.npmjs.com/package/apify
        Puppeteer : https://www.npmjs.com/package/puppeteer
        Cheerio : https://www.npmjs.com/package/cheerio
        NodeMailer : https://www.npmjs.com/package/nodemailer
