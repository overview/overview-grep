BOWER=node_modules/.bin/bower
LESSC=node_modules/.bin/lessc
UGLIFY=node_modules/.bin/uglifyjs
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

clean:
	rm public/deps.js
	rm public/style.css

clean-deps:
	rm -rf node_modules
	rm -rf bower_components

public/deps.js: bower_components
	$(UGLIFY) \
		$(BC)/oboe/dist/oboe-browser.js \
		$(BC)/angular/angular.js \
		$(BC)/angular-base64/angular-base64.js \
		-o public/deps.js

public/style.css: bower_components
	$(LESSC) -x style/style.less public/style.css

.PHONY: assets
assets: public/deps.js public/style.css

watch:
	watchr -e "watch('.*') { system 'make assets' }"

upload:
	aws s3 sync --acl public-read --delete public/ s3://overview.pudo.org/grep/
	aws s3 cp --acl public-read --content-type 'text/html' public/show s3://overview.pudo.org/grep/
	aws s3 cp --acl public-read --content-type 'application/json' public/metadata s3://overview.pudo.org/grep/
