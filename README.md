B9Lab Project-1: Remittance 

Note to self:

npm install webpack webpack-cli --save-dev
./node_modules/.bin/truffle compile

touch webpack.config.js #show where your app.js is
./node_modules/.bin/webpack-cli --mode development

npm install file-loader --save-dev
nano ./app/js/app.js # add require("file-loader?name=../index.html!../index.html");
./node_modules/.bin/webpack-cli --mode development

ganache-cli --host 0.0.0.0
./node_modules/.bin/truffle migrate
./node_modules/.bin/webpack-cli --mode development


npx http-server ./build/app/ -a 0.0.0.0 -p 8000 -c-1
