
var https = require('https');
var pagerduty_auth = "Token token=<your pagerduty token>";
var pagerduty_from = "<your email>";
var match = false;

var options = {
  host: 'hooks.slack.com',
  port: 443,
  path: '/services/T0P8KN51P/B1Z8A6L78/rj5hhXhTr1tnyBXiz8Ag4uDO',
  method: 'POST'
};

var pagerduty_get_options = {
  hostname: 'api.pagerduty.com',
  port: '443',
  path: '/incidents?limit=50',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.pagerduty+json;version=2',
    'From': pagerduty_from,
    'Authorization': pagerduty_auth
  }
};

var pd_update_options = {
  hostname: 'api.pagerduty.com',
  port: '443',
  path: '/incidents',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.pagerduty+json;version=2',
    'From': pagerduty_from,
    'Authorization': pagerduty_auth
  }
};




/**
 * This sample shows how to create a simple Lambda function for handling speechlet requests.
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and replace application.id with yours
         * to prevent other voice applications from using this function.
         */
        /*
        if (event.session.application.id !== "amzn1.echo-sdk-ams.app.[your own app id goes here]") {
            context.fail("Invalid Application ID");
        }
        */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);

            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
                + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the app without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
                + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/** 
 * Called when the user specifies an intent for this application.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
                + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent;
    var intentName = intentRequest.intent.name;

    if ("MyMessageIntent" === intentName) {
        console.log("MyMessageIntent");
        setMessageInSession(intent, session, callback);
    } 
    else if ("StartDemoIntent" === intentName) {
        console.log("StartDemoIntent");
        startDemo(intent, session, callback);
    } 
    else if ("ThatsThePlanIntent" === intentName) {
        console.log("ThatsThePlanIntent");
        thatsThePlan(intent, session, callback);
    }
    else if ("PagerMeIntent" === intentName) {
        console.log("PagerMeIntent");
        sendPagerMe(intent, session, callback);
    }
    else if ("ReactIntent" === intentName) {
        console.log("ReactIntent");
        sendReaction(intent, session, callback);
    }
    else if ("NewRelicIntent" === intentName) {
        console.log("NewRelicIntent");
        sendNewRelicCommand(intent, session, callback);
    } 
    else if ("PagerDutyCreateIntent" === intentName) {
        console.log("PagerDutyCreateIntent");
        createPagerDutyIncident(intent, session, callback);
    } 
    else if ("PagerDutyAckIntent" === intentName) {
        console.log("PagerDutyAckIntent");
        ackPagerDutyIncident(intent, session, callback);
    } 
    else if ("PDResolveIntent" === intentName) {
        console.log("PDResolveIntent");
        resolvePagerDutyIncident(intent, session, callback);
    } 
    else if ("WhatsMyMessageIntent" === intentName) {
        console.log("WhatsMyMessageIntent");
        getMessageFromSession(intent, session, callback);
    } else {
        console.log("Unknown intent");
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the app returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
                + ", sessionId=" + session.sessionId);
}

/**
 * Helpers that build all of the responses.
 */
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    }
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    }
}

/** 
 * Functions that control the app's behavior.
 */
function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "What would you like to post in Slack?";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please let me know what you would like to post in Slack.";
    var shouldEndSession = false;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


function startDemo(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlot = intent.slots.StartMessage;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    if (messageSlot) {
        message = messageSlot.value;
        console.log("Message slot contains: " + message + ".");
        sessionAttributes = createMessageAttributes(message);
        speechOutput = "You are not seriously going to try to do a demo in front of all of these people are you?";
        repromptText = "You can ask me to repeat your message by saying, what's my message?";
        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                callback(sessionAttributes, 
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            });
        });
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
            context.fail(e);
        });
        //req.write('{"channel": "#bu_bot_test", "username": "Aaron\'s Amazon Echo", "text": "atbot newrelic ' + message + '", "icon_emoji": ":echo:"}');
        req.end();
    } else {
        speechOutput = "I didn't hear your message clearly, please try again";
        repromptText = "I didn't hear your message clearly, you can give me your "
                + "message by saying, my message is...";
    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
    
    
}

function thatsThePlan(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlot = intent.slots.PlanMessage;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    if (messageSlot) {
        message = messageSlot.value;
        console.log("Message slot contains: " + message + ".");
        sessionAttributes = createMessageAttributes(message);
        speechOutput = "Ok what could go wrong? You are planning on using the Echo, right? Hopefully not that janky Raspberry Pi.";
        repromptText = "Are we going to do this?";
        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                callback(sessionAttributes, 
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            });
        });
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
            context.fail(e);
        });
        //req.write('{"channel": "#bu_bot_test", "username": "Aaron\'s Amazon Echo", "text": "atbot newrelic ' + message + '", "icon_emoji": ":echo:"}');
        req.end();
    } else {
        speechOutput = "I didn't hear your message clearly, please try again";
        repromptText = "I didn't hear your message clearly, you can give me your "
                + "message by saying, my message is...";
    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
    
    
}

function sendReaction(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlot = intent.slots.ReactMessage;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    if (messageSlot) {
        message = messageSlot.value;
        console.log("Message slot contains: " + message + ".");
        sessionAttributes = createMessageAttributes(message);
        speechOutput = message + "reaction sent.";
        repromptText = message + "reaction sent.";
        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                callback(sessionAttributes, 
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            });
        });
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
            context.fail(e);
        });
        req.write('{"channel": "#bu_bot_test", "username": "Aaron\'s Amazon Echo", "text": "atbot react ' + message + '", "icon_emoji": ":echo:"}');
        req.end();
    } else {
        speechOutput = "I didn't hear your message clearly, please try again";
        repromptText = "I didn't hear your message clearly, you can give me your "
                + "message by saying, my message is...";
    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
    
    
}

function sendPagerMe(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlot = intent.slots.PagerMeMessage;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    if (messageSlot) {
        message = messageSlot.value;
        console.log("Message slot contains: " + message + ".");
        sessionAttributes = createMessageAttributes(message);
        speechOutput = "Your message has been sent. You can ask me to repeat it by saying, "
                + "what's my message?";
        repromptText = "You can ask me to repeat your message by saying, what's my message?";
        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                callback(sessionAttributes, 
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            });
        });
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
            context.fail(e);
        });
        req.write('{"channel": "#bu_bot_test", "username": "Aaron\'s Amazon Echo", "text": "atbot pager me as ablythe@hearst.com", "icon_emoji": ":echo:"}');
        req.end();
    } else {
        speechOutput = "I didn't hear your message clearly, please try again";
        repromptText = "I didn't hear your message clearly, you can give me your "
                + "message by saying, my message is...";
    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
    
    
}

function sendNewRelicCommand(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlot = intent.slots.NRMessage;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    if (messageSlot) {
        message = messageSlot.value;
        console.log("Message slot contains: " + message + ".");
        sessionAttributes = createMessageAttributes(message);
        speechOutput = "The latest server information should now show in the Slack Room.";
        repromptText = "The latest server information should now show in the Slack Room.";
        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                callback(sessionAttributes, 
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            });
        });
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
            context.fail(e);
        });
        req.write('{"channel": "#bu_bot_test", "username": "Aaron\'s Amazon Echo", "text": "atbot newrelic ' + message + '", "icon_emoji": ":echo:"}');
        req.end();
    } else {
        speechOutput = "I didn't hear your message clearly, please try again";
        repromptText = "I didn't hear your message clearly, you can give me your "
                + "message by saying, my message is...";
    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
    
    
}

function createPagerDutyIncident(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlot = intent.slots.PDCMessage;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    if (messageSlot) {
        message = messageSlot.value;
        console.log("Message slot contains: " + message + ".");
        sessionAttributes = createMessageAttributes(message);
        speechOutput = "I have told the Slack room to create a new incident for " + message;
        repromptText = "I have told PagerDuty to create a new incident for " + message;
        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                callback(sessionAttributes, 
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            });
        });
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
            context.fail(e);
        });
        req.write('{"channel": "#bu_bot_test", "username": "Aaron\'s Amazon Echo", "text": "bubot pager trigger Testing_Schedule Alexa triggered incident for ' + message + '", "icon_emoji": ":echo:"}');
        req.end();
    } else {
        speechOutput = "I didn't hear your message clearly, please try again";
        repromptText = "I didn't hear your message clearly, you can give me your "
                + "message by saying, my message is...";
    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
    
    
}


function ackPagerDutyIncident(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlot = intent.slots.PDAMessage;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    if (messageSlot) {
        number = messageSlot.value;
        console.log("Message slot contains: " + number + ".");
        sessionAttributes = createMessageAttributes(number);
        speechOutput = "I have told PagerDuty to acknowledge incident number" + number;
        repromptText = "I have told PagerDuty to acknowledge incident number" + number;
        var req = https.request(pagerduty_get_options, function(res) {
          var info = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            info += chunk;
          });
          res.on('end', () => {
            content = JSON.parse(info);
            if (res.statusCode != 200){
              console.log('pagerduty get issues failed')
              console.log('statusCode:', res.statusCode);
              console.log(content);
            }
            //console.log(content);
            ref = content.incidents;
            if (number == "latest") {
              number = 0;
              for (j = 0, len = content.incidents.length; j < len; j++) {
                if (content.incidents[j].incident_number > number){
                  number = content.incidents[j].incident_number;
                }
              }
              console.log("latest was sent in using: " + number);
            }
      
            for (i = 0, len = content.incidents.length; i < len; i++) {
              
              if (content.incidents[i].incident_number == number) {
                match = true;
                console.log("************found it***********");
                console.log(content.incidents[i].id);
                // Acknowledge the incident that was matched
                var update_req = https.request(pd_update_options, function(update_res) {
                  var update_info = '';
                  update_res.setEncoding('utf8');
                  update_res.on('data', (chunk) => {
                    update_info += chunk;

                  });
                  update_res.on('end', () => {
                    update_content = JSON.parse(update_info);
                    if (update_res.statusCode != 200){
                      console.log('pagerduty ack issues failed')
                      console.log('statusCode:', update_res.statusCode);
                      console.log(update_content);
                    }
                    console.log(update_content);

                  });
                });
                var putdata = JSON.stringify({
                  "incidents": [{
                    "id" : content.incidents[i].id,
                    "type" : "incident",
                    "status" : "acknowledged"
                  }]
                });
                console.log(putdata);
                update_req.write(putdata);
                update_req.on('error', (e) => {
                  console.error(e);
                  context.fail(e);
                });
                //feel like this should go in the on update_res.on('end'... but is timing out.
                speechOutput = "I have told Pager Duty to acknowledge incident number" + number;
                repromptText = "I have told Pager Duty to acknowledge incident number" + number;
                callback(sessionAttributes, 
                      buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                update_req.end();
              }
            }
            //if (match == false){
            // console.log("Did not match the incident: " + number);
            //}
          });
        });
        req.on('error', (e) => {
          console.error(e);
          context.fail(e);
        });
        req.end();
    } else {
        speechOutput = "I didn't hear your message clearly, please try again";
        repromptText = "I didn't hear your message clearly, you can give me your "
                + "message by saying, my message is...";
    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
    
    
}

function resolvePagerDutyIncident(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlot = intent.slots.PDRMessage;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    if (messageSlot) {
        number = messageSlot.value;
        console.log("Message slot contains: " + number + ".");
        sessionAttributes = createMessageAttributes(number);
        speechOutput = "I have told PagerDuty to resolve incident number" + number;
        repromptText = "I have told PagerDuty to resolve incident number" + number;
        var req = https.request(pagerduty_get_options, function(res) {
          var info = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            info += chunk;
          });
          res.on('end', () => {
            content = JSON.parse(info);
            if (res.statusCode != 200){
              console.log('pagerduty get issues failed')
              console.log('statusCode:', res.statusCode);
              console.log(content);
            }
            ref = content.incidents;
            if (number == "latest") {
              number = 0;
              for (j = 0, len = content.incidents.length; j < len; j++) {
                if (content.incidents[j].incident_number > number){
                  number = content.incidents[j].incident_number;
                }
              }
              console.log("latest was sent in using: " + number);
            }
      
            for (i = 0, len = content.incidents.length; i < len; i++) {
              
              if (content.incidents[i].incident_number == number) {
                match = true;
                console.log("************found it***********");
                console.log(content.incidents[i].id);
                // Resolve the incident that was matched
                var update_req = https.request(pd_update_options, function(update_res) {
                  var update_info = '';
                  update_res.setEncoding('utf8');
                  update_res.on('data', (chunk) => {
                    update_info += chunk;
                  });
                  update_res.on('end', () => {
                    update_content = JSON.parse(update_info);
                    if (update_res.statusCode != 200){
                      console.log('pagerduty resolve issues failed')
                      console.log('statusCode:', update_res.statusCode);
                      console.log(update_content);
                    }
                    console.log('statusCode:', update_res.statusCode);
                    console.log(update_content);
                  });
                });
                var putdata = JSON.stringify({
                  "incidents": [{
                    "id" : content.incidents[i].id,
                    "type" : "incident",
                    "status" : "resolved"
                  }]
                });
                console.log(putdata);
                update_req.write(putdata);
                update_req.on('error', (e) => {
                  console.error(e);
                  context.fail(e);
                });
                //feel like this should go in the on update_res.on('end'... but is timing out.
                repromptText = "I have told Pager Duty to resolve incident number" + number;
                speechOutput = "I have told Pager Duty to resolve incident number" + number;
                callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                
                update_req.end();
              }
            }
            if (match == false){
              console.log("Did not match the incident: " + number);
            }
          });
        });
        req.on('error', (e) => {
          console.error(e);
          context.fail(e);
        });
        req.end();
 
    } else {
        speechOutput = "I didn't hear your message clearly, please try again";
        repromptText = "I didn't hear your message clearly, you can give me your "
                + "message by saying, my message is...";
    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
    
    
}

/**
 * Sets the message in the session and prepares the speech to reply to the user.
 */
function setMessageInSession(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlot = intent.slots.Message;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    if (messageSlot) {
        message = messageSlot.value;
        console.log("Message slot contains: " + message + ".");
        sessionAttributes = createMessageAttributes(message);
        speechOutput = "Your message has been sent. You can ask me to repeat it by saying, "
                + "what's my message?";
        repromptText = "You can ask me to repeat your message by saying, what's my message?";
        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                callback(sessionAttributes, 
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            });
        });
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
            context.fail(e);
        });
        req.write('{"channel": "#bu_bot_test", "username": "Aaron\'s Amazon Echo", "text": "atbot ' + message + '", "icon_emoji": ":echo:"}');
        req.end();
    } else {
        speechOutput = "I didn't hear your message clearly, please try again";
        repromptText = "I didn't hear your message clearly, you can give me your "
                + "message by saying, my message is...";
    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
}

function createMessageAttributes(message) {
    return {
        message: message
    };
}

function getMessageFromSession(intent, session, callback) {
    var cardTitle = intent.name;
    var message;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if(session.attributes) {
        message = session.attributes.message;
    }

    if(message) {
        speechOutput = "Your message is " + message + ", goodbye";
        shouldEndSession = true;
    }
    else {
        speechOutput = "I didn't hear your message clearly. As an example, you can say, My message is 'hello, team!'";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user. 
    // If the user does not respond or says something that is not understood, the app session 
    // closes.
    callback(sessionAttributes,
             buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}