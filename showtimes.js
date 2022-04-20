const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const creds = require('./creds.js');

var pendingCalls = 0;

var subscribers = "karthikkasturi97@gmail.com, amithreddynomula@gmail.com, saifriends.7@gmail.com, sreekar37.999@gmail.com";
subscribers = "karthikkasturi97@gmail.com, satellirakesh33@gmail.com, s4sashank95@gmail.com";
subscribers = "karthikkasturi97@gmail.com, s4sashank95@gmail.com";
subscribers = "karthikkasturi97@gmail.com";
var allEvents = {};

function checkShowTimingsChanged(event, bookingDate, venueNameReq) {
    pendingCalls++;
    if (allEvents[event.eventId] === undefined) {
        allEvents[event.eventId] = {
            showTimes: undefined,
            movieName: event.movieName
        };
    }
    fetch("https://in.bookmyshow.com/ibvcom/getJSData.bms?cmd=GETSHOWTIMESBYEVENT&srid=HYD&eid=" + event.eventId + "&did=" + bookingDate, {
        "credentials": "omit",
        "headers": {
            "cache-control": "no-store",
            "content-type": "text/javascript"
        },
        "referrer": "https://in.bookmyshow.com/ibv/?cn=PRSD",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": null,
        "method": "GET",
        "mode": "cors"
    }).then(x => x.text()).then(x => {
        pendingCalls--;
        var arrEvents, arrVenues, arrShowTimes, initRun = false;
        // clog('then x', x);
        eval(x);
        var subs = subscribers;
        if (!allEvents[event.eventId].showTimes) {
            allEvents[event.eventId].showTimes = [];
            subs = "karthikkasturi97@gmail.com";
            initRun = true;
        }
        var currentStoredShowTimes = allEvents[event.eventId].showTimes;
        var showTimesUpdated = false;
        var newShowTimes = [];
        for (var show of arrShowTimes) {
            var venueCode = show[0];
            var showTime = show[3];
		//clog(venueCode, venueNameReq)
            if (venueCode == venueNameReq && !currentStoredShowTimes.some(x => x === showTime)) {
		currentStoredShowTimes.push(showTime);
                showTimesUpdated = true;
                if (!initRun)
                    newShowTimes.push(showTime);
            }
        }
        if (showTimesUpdated || initRun) {
            var body = "";
            body = event.movieName + " is available at:\n\n";
            if (!initRun) {
                body += "<b>" + newShowTimes.join('\n\n') + "</b>\n\n";
            }
            body += currentStoredShowTimes.join('\n\n');
            clog("**************************")
            clog(body)
            clog("**************************")
            body += "\n\n\n\n<i>Mail me at karthikkasturi97@gmail.com to unsubscribe from these mails.</i>";
            body = body.replace(/\n/g, "<br>");


            sendMail("wrucebaynebatsy@gmail.com",
                subs,
                (initRun ? ("[INITIALIZED SERVICE] " + event.movieName + " showtimes updated") : (event.movieName + " showtimes updated")) + " " + new Date(),
                body)
        }
        repoll();
    }).catch(x => clog({'error': x}));

}



function findStuff(movieName, bookingDate, venueNameReq) {
    pendingCalls++;
    fetch("https://in.bookmyshow.com/ibvcom/getJSData.bms?cmd=GETEVENTSBYSUBREGION&srid=HYD", {
        "credentials": "omit",
        "headers": {
            "cache-control": "no-store",
            "content-type": "text/javascript"
        },
        "referrer": "https://in.bookmyshow.com/ibv/?cn=PRSD",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": null,
        "method": "GET",
        "mode": "cors"
    }).then(x => x.text()).then(x => {
        var arrEvents;
        // clog(x); 
        eval(x); // Get arrEvents
        //clog(arrEvents)
        for (var event of arrEvents) {
            if (event[1].toLowerCase().includes(movieName)) {
                var data = {
                    eventId: event[0],
                    movieName: event[1],
                    releaseDate: event[2]
                }
                checkShowTimingsChanged(data, bookingDate, venueNameReq)
            }
            // sendMail('wrucebaynebatsy@gmail.com', 'karthikkasturi97@gmail.com', 'uri found', JSON.stringify(event))
        }
        pendingCalls--;
        repoll();
    });
}

function sendMail(from, to, subject, body) {
    if (!from || !to || !body) {
        throw "WTF MAN";
    }
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: creds.mailAuth,
    });

    var mailOptions = {
        from: from,
        to: to,
        subject: subject,
        html: body
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            clog(error);
        } else {
            clog('Email sent: ' + info.response);
        }
    });
}


function repoll() {
    return;
    if (pendingCalls == 0) {
        setTimeout(init, 40000);
    }
}
var lastHour = null;
function init() {
    var currentHour = new Date().getHours();
    if (currentHour === 26) { // Change if you wanna stop the serivce at a particular time
        sendMail("wrucebaynebatsy@gmail.com", "karthikkasturi97@gmail.com", "[STOPPED POLLING SERVICE] " + new Date(), "Polling service stopped at " + new Date());
        return;
    }
    if (currentHour != lastHour) {
        if (lastHour !== null) {
            var allEventsStr = "Polling service is running at " + new Date();
            allEventsStr += "<br> Current Status: <br/>";

            for (var key of Object.keys(allEvents)) {
                var currEvent = allEvents[key];
                allEventsStr += "<br>*************";
                allEventsStr += currEvent.movieName + ": [" + key + "]<br>";
                allEventsStr += currEvent.showTimes.join("<br>");
                allEventsStr += "<br>*************<br><br>";
            }
            sendMail("wrucebaynebatsy@gmail.com", "karthikkasturi97@gmail.com", "[POLLING SERVICE STATUS] Service Running", allEventsStr);
        }
        lastHour = currentHour;
    }
    clog("Polling! at " + new Date(), true)
    findStuff('strange', '20220506', 'AMBH');
}

var lastWasReplaceable = false;

function clog(str, replace) {
    if(replace) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(str)
        lastWasReplaceable = true;
        return;
    }
    if(lastWasReplaceable && !replace) {
        process.stdout.write('\n');
    }
    console.log(str)
    lastWasReplaceable = replace;
}

clog({a: "ge"})

init();
setInterval(init, 10000)