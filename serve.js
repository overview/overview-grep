var express = require('express');
var API = require('overview-api-node');
var oboe = require('oboe');

var app = express();

app.use(function(req, res, next) {
  if (['/show', '/metadata'].indexOf(req.path) != -1) {
    res.set('Content-Type', 'text/html');
  }
  res.set('Access-Control-Allow-Origin', '*');
  next();
});

app.use(express.static('public'));

app.get('/parse', function(req, res, next) {
  var client = new API(req.query.server, req.query.apiToken, oboe),
    regex = new RegExp(req.query.regex),
    matches = [];

  client.docSet(req.query.documentSetId).getDocuments()
    .node('items.*', function(item) {
      if (regex.test(item.text)) {
        matches.push(item.id);
      }
      return oboe.drop;
    })
    .done(function() {
      res.send({
        status: 'ok',
        query: req.query,
        matches: matches
      });
    });
});

var port = parseInt(process.env.PORT, 10) || 9001;
app.listen(port);

console.log("Listening on http://localhost:" + port);
