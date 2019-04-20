const fetch = require('node-fetch');
const say = require('say');
const creds = require('./creds.js');
var nodemailer = require('nodemailer');


var lastT = 0, calls = 0, sentMails = [], cinemaDateNotOpen = [];

function poll(url, options) {
    calls++;
    for(var i = 0; i < cinemaDateNotOpen.length; i++ ){
        if(cinemaDateNotOpen[i].url === url) {
            if(new Date() - cinemaDateNotOpen[i].lastCheck > 3600000)
            {
                console.log('unblocked '+ cinemaDateNotOpen[i].cinemaName)
                cinemaDateNotOpen.splice(i, 1); 
                break;
            }
            console.log("skipping " + cinemaDateNotOpen[i].cinemaName + " as it is blocked");
            setTimeout(pollDone, 0);
            return;
        }
    }
    console.log('begin polling '+ options.cinemaName)
    fetch(url, { 
        "credentials": "include", 
        "headers": { 
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "cache-control": "no-cache", 
            "pragma": "no-cache", 
            "upgrade-insecure-requests": "1" 
        }, 
        "referrer": "https://in.bookmyshow.com/buytickets/asian-shiva-4k-dilsukhnagar/cinema-hyd-ASSH-MT/20190418",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": null, 
        "method": "GET", 
        "mode": "cors" 
    })
    .then(x => {
        if(false && x.url !== url) {
            if(!cinemaDateNotOpen.some(x => x.url === url))
            {
                console.log("blocking " + options.cinemaName)
                cinemaDateNotOpen.push({ 
                    url: url,
                    lastCheck: new Date(),
                    cinemaName: options.cinemaName,
                })
            }
            return new Promise((res) => res(""));  
        }
        return x.text();
    })
    .then(text => { 
        for(var searchFor of options.searchFor)
        {
            searchFor = searchFor.trim();
            if(searchFor.length == 0)
            {
                continue;
            }
            if(text.toLowerCase().includes(searchFor.toLowerCase()))
            {
                console.log(searchFor + " available at " + options.cinemaName);
                // console.log(sentMails)
                
                if(options.subscriber.length > 0 && !sentMails.includes(options.cinemaName + searchFor + options.subscriber))
                {
                    console.log('trying to mail')
                    sentMails.push(options.cinemaName+searchFor+options.subscriber)
                    var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: creds.mailAuth,
                    });
                    
                    var mailOptions = {
                        from: 'kk11051997@gmail.com',
                        to: options.subscriber,
                        subject: 'Bookings open in ' + options.cinemaName + ' for ' + searchFor,
                        text: 'You recieved this automated notification as you asked for it(If you didn\'t, this is probably a test email.)'
                    };
                    
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });
                    // say.speak(searchFor + ' available at ' + options.cinemaName);

                }
                
            }
            else
            {
                console.log(searchFor + " not available at " + options.cinemaName);
            }
        }
        
		console.log('done polling ' + options.cinemaName );
        pollDone();
    })
    .catch(err => {
        console.log(err);
        pollDone();
    })
}

function pollDone() {
    calls--;
    console.log('pending calls: ' + calls)
    if(calls == 0){
        if(lastT)
        {
            clearTimeout(lastT);
        }   
        console.log('queued repoll after 40 seconds')
        console.log('**********************************')
        lastT = setTimeout(init, 40000);
    }
}

function init(){
    if(new Date().getHours() > 24)
    {
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: creds.mailAuth,
        });
        
        var mailOptions = {
            from: 'kk11051997@gmail.com',
            to: 'kk11051997@gmail.com, karthikkasturi97@gmail.com',
            subject: 'Stopped service at ' + new Date() ,
            text: 'Poller stopped at home'
        };
        
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        return;
    }
    console.log('************************************')
    console.log("Polling all stations(runtime: " + new Date() + ")")
    console.log('************************************')
    poll("https://in.bookmyshow.com/buytickets/prasads-large-screen/cinema-hyd-PRHY-MT/20190426", {
        searchFor : ['endgame'],
        cinemaName: 'I-MAX',
        subscriber: 'kk11051997@gmail.com, karthikkasturi97@gmail.com',
    });
    
    poll("https://in.bookmyshow.com/buytickets/prasads-hyderabad/cinema-hyd-PRHN-MT/20190426", {
        searchFor : ['endgame'],
        cinemaName: 'Prasads',
        subscriber: 'kk11051997@gmail.com, karthikkasturi97@gmail.com',
    });
    if(initialRun)
    {
        poll("https://in.bookmyshow.com/buytickets/prasads-large-screen/cinema-hyd-PRHY-MT/20190418", {
            searchFor : ['kalank'],
            cinemaName: '[INITAL RUN] I-MAX',
            subscriber: 'kk11051997@gmail.com, karthikkasturi97@gmail.com',
        });

        // poll("https://in.bookmyshow.com/buytickets/avengers-endgame-hyderabad/movie-hyd-ET00100559-MT/20190426", {
        //     searchFor : [
        //         'Sri Sai Ram 70mm A/C 4k Dolby Atmos', 
        //     ], 
        //     cinemaName: '[INITIAL RUN]Avengers: Endgame (All theaters ping)',
        //     subscriber: 'kk11051997@gmail.com, karthikkasturi97@gmail.com',
        // });
    }
    initialRun = false
    // poll("https://in.bookmyshow.com/buytickets/avengers-endgame-hyderabad/movie-hyd-ET00100559-MT/20190426", {
    //     searchFor : [
    //         'Asian Shiva 4K: Dilsukhnagar', 
    //         'Asian Ganga 4K: Dilsukhnagar',  
    //         'BVK Multiplex Vijayalakshmi', 
    //         'AMB Cinemas: Gachibowli', 
    //         'INOX: Maheshwari', 
    //         'Miraj Cinemas: Shalini Shivani',
    //     ], 
    //     cinemaName: 'Avengers: Endgame (All theaters ping)',
    //     subscriber: 'kk11051997@gmail.com, karthikkasturi97@gmail.com, amithreddynomula@gmail.com',
    // });
    poll("https://in.bookmyshow.com/buytickets/avengers-endgame-hyderabad/movie-hyd-ET00100559-MT/20190426", {
        searchFor : [
            'book tickets', 
        ], 
        cinemaName: 'Avengers: Endgame (All theaters ping)',
        subscriber: 'kk11051997@gmail.com, karthikkasturi97@gmail.com',
    });
}

var initialRun = true
lastT = setTimeout(init, 0);

