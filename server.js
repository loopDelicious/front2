var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var key = require('./secrets.js');

var app = express();

// allow CORS access
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.header("Content-Type", "application/json");
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// POST request to obtain an access token
app.get('/api/', function (req, res) {
    res.send('test');

    var url = 'https://api.github.com/authorizations';
    var client_secret = key.githubToken;
    var data = {
        "scopes": ["public_repo"],
        "note": "getting-started"
    };
    var auth = new Buffer(client_id + ':' + client_secret).toString('base64');

    request.post({
        url: url,
        body: JSON.stringify(data),
        headers: {
            Authorization: 'Basic ' + auth,
            'Content-Type': 'application/json'
        }
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        }
        else {
            res.status(400).send(body);
        }
    });
});

var conversation;

function createIssue() {

    var github_base = 'https://api.github.com';
    var github_url = github_base + '/repos/loopDelicious/front/issues';
    var data = {
        title: conversation.subject,
        body: conversation.summary
    };

    request.post({
        url: github_url,
        body: JSON.stringify(data),
        headers: {
            Authorization: 'Basic ' + key.githubToken,
            'Content-Type': 'application/json'
        }
    }, function (error, response, body) {
        console.log(response);
        if (!error && response.statusCode == 200) {
            callback(false, body);
        } else {
            console.log('octo search ' + error);
            callback(error);
        }
    });
}


app.listen(process.env.PORT || 3010);
