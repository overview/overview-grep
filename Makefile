BOWER=node_modules/.bin/bower
LESSC=node_modules/.bin/lessc
UGLIFY=node_modules/.bin/uglifyjs
NODE=node
NPM=npm
BC=bower_components

all: install clean assets

node_modules:
	$(NPM) install

bower_components:
	$(BOWER) install

install: node_modules bower_components

clean:
	rm -f public/script.js
	rm -f public/style.css

clean-deps:
	rm -rf node_modules
	rm -rf bower_components

public/script.js: bower_components
	$(UGLIFY) \
		$(BC)/angular/angular.js \
		public/app.js \
		-o public/script.js

public/style.css: bower_components
	$(LESSC) -x style/style.less public/style.css

.PHONY: assets
assets: public/script.js public/style.css

watch:
	watchr -e "watch('.*') { system 'make assets' }"
