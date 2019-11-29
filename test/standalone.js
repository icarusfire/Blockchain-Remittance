const Web3 = require('web3');
const web3 = new Web3();
const Ganache = require('ganache-cli');
web3.setProvider(Ganache.provider());
const truffleContract = require("truffle-contract");
const Remittance = truffleContract(require(__dirname + "/../build/contracts/Remittance.json"));

Remittance.setProvider(web3.currentProvider);
Remittance.setProvider(web3.currentProvider);
const assert = require('assert-plus');

Promise = require("bluebird");
const truffleAssert = require('truffle-assertions');
const getBalance = web3.eth.getBalance;
const { BN, toWei,fromWei, sha3, fromAscii, soliditySha3 } = web3.utils;
const amountToSend = toWei("0.2", "ether");

const passw1String = "abcd";
const passw2String = "efgh";

const passw1 = web3.utils.asciiToHex(passw1String).padEnd(66, "0");
const passw2 = web3.utils.asciiToHex(passw2String).padEnd(66, "0");

describe("Remittance", function() {    
    console.log("Current host:", web3.currentProvider.host);
    let accounts, networkId, passwHash, salt, instance, owner, alice, carol;

    before("get accounts", async function() {
        accounts = await web3.eth.getAccounts();
        networkId = await web3.eth.net.getId();
        Remittance.setNetwork(networkId);

        [owner, alice, bob, carol] = accounts;
    });
    
    beforeEach(async function() {
        instance = await Remittance.new(false, {from: owner} )
        salt = await instance.salt({ from: carol });  
        passwHash = await instance.hashPasswords.call(passw1, passw2, { from: carol });  
    });

    it("anyone can create a hash", async function() {
        console.log(salt);
        passwHash = await instance.hashPasswords.call(passw1, passw2, { from: carol });  
        assert.strictEqual(passwHash.toString(10), soliditySha3(passw1, passw2, salt));
        _tx = await instance.hashPasswords.sendTransaction(passw1, passw2, { from: carol });
        assert.strictEqual(_tx.receipt['rawLogs'].length, 0);
    });

    it("anyone can validate their hash", async function() {
        isValidHash = await instance.hashValidate.call(soliditySha3(passw1, passw2, salt), passw1, passw2, { from: carol });  
        assert.equal(isValidHash, true);
    });
        
    it("anyone can create an account", async function() {
        let tx = await instance.createAccount(passwHash, 1,{ from: alice, value:amountToSend });    
        truffleAssert.eventEmitted(tx, 'accountCreatedEvent', (event) => {
            return event.passwordHash == passwHash && event.sender == alice && event.amount.toString(10) == amountToSend.toString(10);
        });

        assert.strictEqual((await getBalance(instance.address)).toString(10), amountToSend.toString(10));
        assert.strictEqual((await instance.accounts(passwHash)).amount.toString(10), amountToSend.toString(10));
    });

    it("carol can withdraw if she has the hash", async function() {        
        await instance.createAccount(passwHash, 1, { from: alice, value:amountToSend }); 
        let txWithDraw = await instance.withdraw(passw1, passw2, { from: carol});   

        truffleAssert.eventEmitted(txWithDraw, 'withdrawEvent', (event) => {
            return event.passwordHash == passwHash && event.sender == carol && event.amount.toString(10) == amountToSend.toString(10);
        });

        assert.strictEqual((await instance.accounts(passwHash)).amount.toString(10), '0');
        assert.strictEqual((await getBalance(instance.address)).toString(10), '0');
    });

    it("carol(shop) can not withdraw if it is expired", async function() {        
        await instance.createAccount(passwHash, 0, { from: alice, value:amountToSend }); 

        await truffleAssert.reverts(
            instance.withdraw(passw1, passw2, { from: carol}),   
            "account expired"
        );
    });

    it("alice(sender) can withdraw only if it is expired", async function() {        
        await instance.createAccount(passwHash, 0, { from: alice, value:amountToSend }); 
        let txWithDraw = await instance.withdraw(passw1, passw2, { from: alice});

        truffleAssert.eventEmitted(txWithDraw, 'withdrawEvent', (event) => {
            return event.passwordHash == passwHash && event.sender == alice && event.amount.toString(10) == amountToSend.toString(10);
        });
    });

    it("no one can re-create an account with same hash after withdraw", async function() {
        await instance.createAccount(passwHash, 1, { from: alice, value:amountToSend });    
        await instance.withdraw(passw1, passw2, { from: carol});   

        await truffleAssert.reverts(
            instance.createAccount(passwHash, 1, { from: alice, value:amountToSend }),
            "account already used, pick unique passwords"
        );
    });

    it("no one can override an active account using same hash", async function() {
        await instance.createAccount(passwHash, 1, { from: alice, value:amountToSend });    
        await truffleAssert.reverts(
            instance.createAccount(passwHash, 1, { from: alice, value:amountToSend }),
            "account already used, pick unique passwords"
        );
    });

});