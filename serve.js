var express = require('express');
var API = require('overview-api-node');
var Promise = require('bluebird');
var request = require('request');
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
  var client = new API(req.query.server, req.query.apiToken, oboe);
  var regex = new RegExp(req.query.regex);

  // Each StoreObject represents a query. That StoreObject is linked
  // to the Documents the query matches using DocumentStoreObjects.
  // So, below, we try to find a StoreObject that already exists for this query.
  // If we couldn't find one, we create one in done() and use it for the results.
  // Finally, reject the promise if any request (GET or POST to create) failed.
  var storeObjectIdForQueryPromise = new Promise(function(resolve, reject) {
    client.store().getObjects()
      .node('!.*', function(storeObject) {
        if(storeObject.indexedString === req.query.regex) {
          resolve(storeObject.id);
          this.abort();
        }
        return oboe.drop;
      })
      .done(function(data) {
        new Promise(function(resolve, reject) {
          client.store().createObject({
            "indexedString": req.query.regex,
            "json": {"timestamp": Date.now()}
          }).done(resolve).fail(reject)
        })
        .then(function(storeObject) {
          resolve(storeObject.id);
        })
        .catch(reject);
      })
      .fail(reject);
  });

  // Once we find/create the id for the StoreObject that'll hold the results,
  // we start downloading the documents and checking them each against the regex.
  // As we find matches, we store them in a string that'll be sent to Overview
  // to create all our DocumentStoreObject objects. We get the StoreObject's id
  // first because we need it to build the request string. (If we didn't do this,
  // we'd have to either use more memory or do some unnecessarily fancy footwork.)
  storeObjectIdForQueryPromise.then(function(id) {
    var matchesString = '[';

    client.docSet(req.query.documentSetId).getDocuments(["id", "title", "text"])
      .node('items.*', function(item) {
        if (regex.test(item.title) || regex.test(item.text)) {
          matchesString += '[' + item.id + ',' + id + '],';
        }
        return oboe.drop;
      })
      .done(function() {
        matchesString = matchesString.slice(0, - 1)  + ']';

        // Store the matches
        console.log(client.host + '/api/v1/store/document-objects')
        request.post({
          url: client.host + '/api/v1/store/document-objects',
          headers: {
            "content-type": "application/json",
            "Authorization": 'Basic ' + client.apiTokenEncoded
          },
          body: matchesString
        }, function(err, response) {
          // If saving the matches failed for some reason, let client know.
          // (But, for now, don't retry.)
          if(err) {
            res.json({
              errors: [{
                code: "unknown-error"
              }]
            });
          }
          else {
            // Only after matches are actually saved, respond to client.
            res.json({
              data: {
                id: req.query.regex,
                type: "grep-results",
                attributes: { resultsId: id }
              }
            });
          }
        });
      });
  });
});

var port = parseInt(process.env.PORT, 10) || 9001;
app.listen(port);

console.log("Listening on http://localhost:" + port);
