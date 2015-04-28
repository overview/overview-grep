var express = require('express');

var app = express();

app.use(function(req, res, next) {
  if (['/show', '/metadata'].indexOf(req.path) != -1) {
    res.set('Content-Type', 'text/html');
  }
  res.set('Access-Control-Allow-Origin', '*');
  next();
});

app.use(express.static('public'));

var port = parseInt(process.env.PORT, 10) || 9001;
app.listen(port);

console.log("Listening on http://localhost:" + port);
