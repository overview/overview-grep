var express = require('express'),
    oboe = require('oboe');

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
  var url = req.query.server + '/api/v1/document-sets/' + req.query.documentSetId + '/documents',
      authz = new Buffer(req.query.apiToken + ':x-auth-token').toString('base64'),
      regex = new RegExp(req.query.regex),
      matches = [];

  var ob = oboe({
    url: url + '?stream=true&fields=id,text',
    headers: {
      Authorization: 'Basic ' + authz
    }
  }).node('items.*', function(item) {
    if (regex.test(item.text)) {
      matches.push(item.id);
    }
    return oboe.drop;
  }).done(function() {
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
