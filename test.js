const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const creds = require('./creds.js');

var pendingCalls = 0;

var subscribers = "karthikkasturi97@gmail.com, amithreddynomula@gmail.com, saifriends.7@gmail.com, sreekar37.999@gmail.com"
// subscribers = "karthikkasturi97@gmail.com, nsatyasrikar@gmail.com"
var allEvents = {};

function checkShowTimingsChanged(event, bookingDate) {
    pendingCalls++;
    if(allEvents[event.eventId] === undefined){
        allEvents[event.eventId] = {
            venues: undefined,
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
        //console.log('then x', x);
        eval(x);
        var subs = subscribers;
        if(!allEvents[event.eventId].venues){
            allEvents[event.eventId].venues = [];
            subs = "karthikkasturi97@gmail.com";
            initRun = true;
        }
        var currentStoredVenues = allEvents[event.eventId].venues;
        var venuesUpdated = false;
	var newVenues = [];
        for(var venue of arrVenues){
            // var venueCode = venue[0];
            var venueName = venue[1];
            if(!currentStoredVenues.some(x => x === venueName)){
                currentStoredVenues.push(venueName);
                venuesUpdated = true;
		if(!initRun)
		newVenues.push(venueName);
            }
        }
        if(venuesUpdated || initRun) {
            var body = "";
            body = event.movieName + " is available at:\n\n" ;
	    if(!initRun) {
		body += "<b>" + newVenues.join('\n\n') + "</b>\n";
	    }
	    body += currentStoredVenues.join('\n\n');
            console.log("**************************")
            console.log(body)
            console.log("**************************")
            body+="\n\n\n\n<i>Mail me at karthikkasturi97@gmail.com to unsubscribe from these mails.</i>"
            body = body.replace(/\n/g, "<br>")
            
            
            sendMail("kk11051997@gmail.com", 
                subs,
                (initRun ? ("[INITIALIZED SERVICE] " + event.movieName + " venues updated") : (event.movieName + " venues updated")) + " " + new Date(),
                body)
        }
        repoll();        
    }).catch(x => console.log('error', x));

}



function findStuff(movieName, bookingDate){
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
        // console.log(x); 
        eval(x); // Get arrEvents
//console.log(arrEvents)
        for(var event of arrEvents)
        {
            if(event[1].toLowerCase().includes(movieName))
            {
                var data = {
                    eventId: event[0],
                    movieName: event[1],
                    releaseDate: event[2]
                }
                checkShowTimingsChanged(data, bookingDate)
            }
            // sendMail('kk11051997@gmail.com', 'karthikkasturi97@gmail.com', 'uri found', JSON.stringify(event))
        }
        pendingCalls--;
        repoll();
    });
}

function sendMail(from, to, subject, body){
    if(!from || !to || !body) {
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
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}


function repoll(){
return;
    if(pendingCalls == 0)
    {
        setTimeout(init, 40000);
    }
}
var lastHour = null;
function init(){
    var currentHour = new Date().getHours();
    if(currentHour === 26){ // Change if you wanna stop the serivce at a particular time
        sendMail("kk11051997@gmail.com", "karthikkasturi97@gmail.com", "[STOPPED POLLING SERVICE] " + new Date() , "Polling service stopped at " + new Date());
        return;
    }
    if(currentHour != lastHour)
    {
        if(lastHour !== null)
        {
            var allEventsStr = "Polling service is running at " + new Date();
            allEventsStr += "<br> Current Status: <br/>";

            for(var key of Object.keys(allEvents)) {
                var currEvent = allEvents[key];
                allEventsStr += "<br>*************";
                allEventsStr += currEvent.movieName + ": [" + key + "]<br>";
                allEventsStr += currEvent.venues.join("<br>");
                allEventsStr += "<br>*************<br><br>";
            }
            sendMail("kk11051997@gmail.com", "karthikkasturi97@gmail.com", "[POLLING SERVICE STATUS] Service Running", allEventsStr);
        }
        lastHour = currentHour;
    }
    console.log("Polling! at " + new Date())
    findStuff('sarileru', '20200111');
}

init();
setInterval(init, 10000)