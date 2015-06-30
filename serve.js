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
  var postPromise = Promise.promisify(request.post);
  var client = new API(req.query.server, req.query.apiToken, oboe);
  var regex = new RegExp(req.query.regex);
  var matches = [];

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

  // While we're looking for/creating the StoreObject that'll hold the results,
  // we start downloading the documents and checking them each against the regex.
  // As we find matches, we store them in a matches array that we'll split at
  // the end and send to Overview in chunks (to work around Play's upload limit)
  // to create all our DocumentStoreObject objects.
  client.docSet(req.query.documentSetId).getDocuments(["id", "title", "text"])
    .node('items.*', function(item) {
      if (regex.test(item.title) || regex.test(item.text)) {
        matches.push(item.id);
      }

      return oboe.drop;
    })
    .done(function() {
      storeObjectIdForQueryPromise.then(function(id) {
        var matchSubsets = [];
        while (matches.length > 0) {
          matchSubsets.push(matches.splice(0,1000));
        }

        Promise.map(matchSubsets, function(someMatches) {
          var matchesString = '[' + someMatches.map(function(it) {
            return '[' + it + ',' + id + ']'; // add the store object id too
          }).join(',') + ']';

          return postPromise({
            url: client.host + '/api/v1/store/document-objects',
            headers: {
              "content-type": "application/json",
              "Authorization": 'Basic ' + client.apiTokenEncoded
            },
            body: matchesString
          });
        })
        // We've save all matches successfully, so now we can finally respond.
        .then(function(results) {
          res.json({
            data: {
              id: req.query.regex,
              type: "grep-results",
              attributes: { resultsId: id }
            }
          });
        })
        .catch(function(err) {
          console.log(err);
          // If something went wrong, let client know. But, for now, don't retry.
          res.json({
            errors: [{
              code: "unknown-error"
            }]
          });
        });
      });
    });
});

var port = parseInt(process.env.PORT, 10) || 9001;
app.listen(port);

console.log("Listening on http://localhost:" + port);
