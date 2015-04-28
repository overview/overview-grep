BOWER=node_modules/.bin/bower
LESSC=node_modules/.bin/lessc
UGLIFY=node_modules/.bin/uglify
NODE=node
NPM=npm
BC=bower_components

node_modules:
	$(NPM) install

bower_components:
	$(BOWER) install

install: node_modules bower_components

serve: install
	$(NODE) app.json

clean-deps:
	rm -rf node_modules
	rm -rf bower_components

public/deps.js: bower_components
	$(UGLIFY) --screw-ie8 -c -o public/deps.js \
		$(BC)/angular/angular.js

.PHONY: assets
assets: public/deps.js
	$(LESSC) -x style/style.less public/style.css

watch:
	watchr -e "watch('.*') { system 'make assets' }"
