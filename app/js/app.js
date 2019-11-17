
const Web3 = require("web3");
const truffleContract = require("truffle-contract");
const $ = require("jquery");
// Not to forget our built contract
const splitterJson = require("../../build/contracts/Splitter.json");
require("file-loader?name=../index.html!../index.html");

const Splitter = truffleContract(splitterJson);

if (typeof ethereum !== 'undefined') {
    window.web3 = new Web3(ethereum);
} 
else if (typeof web3 !== 'undefined') {
    window.web3 = new Web3(web3.currentProvider);
} else {
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545')); 
}

const BN = web3.utils.BN;
var toEther = function(balance) { return web3.utils.fromWei(new BN(balance),'ether'); }
var toWei = function(balance) { return web3.utils.toWei(new BN(balance),'ether'); }

Splitter.setProvider(web3.currentProvider);
console.log(web3.currentProvider);

window.addEventListener('load', function() {
    return web3.eth.net.getId()
        .then(network => console.log("Network:", network.toString(10)))
        .then( _ =>{
            if (typeof ethereum !== 'undefined') {
                return ethereum.enable();
            } 
            else {
                return web3.eth.getAccounts();
            }
        })
        .then(accounts => {
            if (accounts.length == 0) {
                $("#balance").html("N/A");
                throw new Error("No account with which to transact");
            }
            window.account = accounts[0];
            console.log("Account:", window.account);
			return web3.eth.getBalance(window.account);		
        })
        // Notice how the conversion to a string is done only when displaying.
        .then(balance => $("#balance").html(toEther(balance.toString(10))))
        .then( _ => Splitter.deployed())
        .then(deployed => web3.eth.getBalance(deployed.address))		
        .then(balance => $("#balance2").html(toEther(balance.toString(10))))
        .then(() => $("#send").click(split))

        // Never let an error go unlogged.
        .catch(console.error);
});
  
const split = function() {
    // Sometimes you have to force the gas amount to a value you know is enough because
    // `web3.eth.estimateGas` may get it wrong.
    const gas = 300000; let deployed;
    // We return the whole promise chain so that other parts of the UI can be informed when
    // it is done.
    return Splitter.deployed()
        .then(_deployed => {
            deployed = _deployed;
            // We simulate the real call and see whether this is likely to work.
            // No point in wasting gas if we have a likely failure.
            return _deployed.splitEther.call( $("input[name='recipient1']").val(), $("input[name='recipient2']").val(),

                // Giving a string is fine
                //$("input[name='amount']").val(),
                { from: window.account, gas: gas, value: toWei($("input[name='amount']").val())});
        })
        .then(success => {
            if (!success) {
                throw new Error("The transaction will fail anyway, not sending");
            }
            console.log("starting split..");
            // Ok, we move onto the proper action.
            return deployed.splitEther(
                $("input[name='recipient1']").val(),
                // Giving a string is fine
                $("input[name='recipient2']").val(),
                { from: window.account, gas: gas, value: toWei($("input[name='amount']").val())})
                // .sendCoin takes time in real life, so we get the txHash immediately while it 
                // is mined.
                .on(
                    "transactionHash",
                    txHash => $("#status").html("Transaction on the way " + txHash)
                );
        })
        // Now we wait for the tx to be mined.
        .then(txObj => {
            const receipt = txObj.receipt;
            if (!receipt.status) {
                console.error("Wrong status");
                console.error(receipt);
                $("#status").html("There was an error in the tx execution, status not 1");
            } else if (receipt.logs.length == 0) {
                console.error("Empty logs");
                console.error(receipt);
                $("#status").html("There was an error in the tx execution, missing expected event");
            } else {
                console.log(receipt.logs[0]);
                $("#status").html("Transfer executed");
                console.log("got receipt", receipt);

            }
            // Make sure we update the UI.
            return web3.eth.getBalance(window.account);

        })
        .then(balance => $("#balance").html(toEther(balance.toString(10))))
        .then( _ => Splitter.deployed())
        .then(deployed => web3.eth.getBalance(deployed.address))		
        .then(balance => $("#balance2").html(toEther(balance.toString(10))))
        .catch(e => {
            $("#status").html(e.toString());
            console.error(e);
        });
};