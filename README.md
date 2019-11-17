B9Lab Project-1: Splitter 
Splits ether between 3 people

Note to self:

npm init
npm install truffle@5.0.8 --save-dev
./node_modules/.bin/truffle unbox metacoin

mkdir -p app/js
$ touch app/js/app.js

npm install create-html --save-dev
./node_modules/.bin/create-html --title "Transfer MetaCoins" --script "js/app.js" --output app/index.html
nano ./app/index.html #add html and buttons
npm install web3@1.2.2 truffle-contract jquery --save
nano ./app/js/app.js. #add require{truffle-contract, web3, jquery, ../../build/contracts/built-contract.json} Add web3 provider, set provider on contract..etc

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