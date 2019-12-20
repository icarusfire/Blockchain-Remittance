Promise = require("bluebird");
const Ganache = require('ganache-cli');
const Web3 = require('web3');
const sinon = require('sinon');
const truffleContract = require("truffle-contract");
const addEvmFunctions = require("../utils/evmFunctions.js");
const assert = require('assert-plus');
const truffleAssert = require('truffle-assertions');
const chai = require('chai');

const web3 = new Web3();
web3.setProvider(Ganache.provider());
const Remittance = truffleContract(require(__dirname + "/../build/contracts/Remittance.json"));
const RemittanceMock = truffleContract(require(__dirname + "/../build/contracts/RemittanceMock.json"));
const getTransaction =  Promise.promisify(web3.eth.getTransaction);
const getBalance = web3.eth.getBalance;
const toWei = function(val) { return web3.utils.toWei(val, "ether") };
const { BN, soliditySha3 } = web3.utils;
const amountToSend = toWei("0.2", "ether");
const oneTimePassword = web3.utils.asciiToHex("abcd").padEnd(66, "0");
const zeroBytes32= '0x0000000000000000000000000000000000000000000000000000000000000000';

Remittance.setProvider(web3.currentProvider);
RemittanceMock.setProvider(web3.currentProvider);
addEvmFunctions(web3);

const expectedBalanceDifference = function (initialBalance, balance, gasUsed, gasPrice) {
     return new BN(balance)
        .add(new BN(gasUsed).mul(gasPrice))
        .sub(new BN(initialBalance)); 
    }

describe("Remittance", function() {    
    console.log("Current host:", web3.currentProvider.host);
    let passwHash, networkId, accounts, shopAddress, salt, instance, owner, alice, carol, sandbox;

    before("get accounts", async function() {
        accounts = await web3.eth.getAccounts();
        networkId = await web3.eth.net.getId();

        Remittance.setNetwork(networkId);
        RemittanceMock.setNetwork(networkId);

        [owner, alice, bob, carol] = accounts;
        //The first password is set to carol's address, so only she can withdraw
        shopAddress = carol;
    });
    
    beforeEach("prepare sandbox", async function() {
        sandbox = sinon.createSandbox();
    });

    beforeEach("prepare instances",async function() {
        instance = await Remittance.new(false, {from: owner} )
        //A contract instance specifically created to mock the function isExpired return value.
        instanceMock = await RemittanceMock.new(false, {from: owner} )
    });

    beforeEach("prepare hash and salt", async function() {
        salt = instance.address;
        saltMock = instanceMock.address;
        passwHash = await instance.hashPasswords(carol, oneTimePassword, { from: carol });  
        passwHashMock = await instanceMock.hashPasswords(carol, oneTimePassword, { from: carol });  
    });

    afterEach("restore sandbox",() => {
        sandbox.restore();
    });

    it("anyone can create a hash", async function() {
        passwHash = await instance.hashPasswords(shopAddress, oneTimePassword, { from: carol });  
        assert.strictEqual(passwHash.toString(10), soliditySha3(shopAddress, oneTimePassword, salt));
        _tx = await instance.hashPasswords.sendTransaction(shopAddress, oneTimePassword, { from: carol });
        assert.strictEqual(_tx.receipt['rawLogs'].length, 0);
    });

    it("anyone can validate their hash", async function() {
        isValidHash = await instance.validateCandidateHash(soliditySha3(shopAddress, oneTimePassword, salt), shopAddress, oneTimePassword, { from: carol });  
        chai.assert.isTrue(isValidHash);
    });
        
    it("anyone can create an account", async function() {
        let tx = await instance.createAccount(passwHash,{ from: alice, value: amountToSend });    
        truffleAssert.eventEmitted(tx, 'AccountCreatedEvent', (event) => {
            return event.passwordHash == passwHash && event.sender == alice && event.amount.toString(10) == amountToSend.toString(10);
        });

        assert.strictEqual((await getBalance(instance.address)).toString(10), amountToSend.toString(10));
        assert.strictEqual((await instance.accounts(passwHash)).amount.toString(10), amountToSend.toString(10));
    });

    it("carol can withdraw if she knows 2 passwords", async function() { 
        let carolInitialBalance = await getBalance(carol);        
        await instance.createAccount(passwHash, { from: alice, value: amountToSend }); 
        let txWithDrawReceipt = await instance.withdraw(oneTimePassword, { from: carol});  
        let trx = await getTransaction(txWithDrawReceipt.tx);
        let carolBalance = await getBalance(carol); 

        let gasUsed = txWithDrawReceipt.receipt.gasUsed;
        let gasPrice = trx.gasPrice;

        truffleAssert.eventEmitted(txWithDrawReceipt, 'WithdrawEvent', (event) => {
            return event.passwordHash == passwHash && event.sender == carol && event.amount.toString(10) == amountToSend.toString(10);
        });
        let expectedDifference = expectedBalanceDifference(carolInitialBalance, carolBalance, gasUsed, new BN(gasPrice));
        assert.strictEqual(expectedDifference.toString(10), toWei('0.2').toString(10)); 
        assert.strictEqual((await instance.accounts(passwHash)).amount.toString(10), '0');
        assert.strictEqual((await getBalance(instance.address)).toString(10), '0');
    });

    it("carol(shop) can not withdraw if it is expired", async function() {
        await instance.createAccount(passwHash, { from: alice, value: amountToSend }); 
        let expirySeconds = (await instance.expiryDuration()).toNumber() + 1;

        await web3.evm.increaseTime(expirySeconds);
        await truffleAssert.reverts(
            instance.withdraw(oneTimePassword, { from: carol}),   
            "account should not be expired"
        );
    });

    it("alice(sender) can cancel only if it is expired", async function() { 
        await instanceMock.createAccount(passwHashMock, { from: alice, value: amountToSend });
        let txWithDraw = await instanceMock.cancelRemittance(passwHashMock, { from: alice});

        truffleAssert.eventEmitted(txWithDraw, 'WithdrawEvent', (event) => {
            return event.passwordHash == passwHashMock && event.sender == alice && event.amount.toString(10) == amountToSend.toString(10);
        });
    });

    it("others can not cancel if it is expired", async function() {        
        await instance.createAccount(passwHash, { from: alice, value: amountToSend }); 

        await truffleAssert.reverts(
            instance.cancelRemittance(passwHash, { from: carol}),   
            "only sender can cancel the payment"
        );
    });

    it("no one can re-create an account with same hash after withdraw", async function() {
        await instance.createAccount(passwHash, { from: alice, value: amountToSend });    
        await instance.withdraw(oneTimePassword, { from: carol});   

        await truffleAssert.reverts(
            instance.createAccount(passwHash, { from: alice, value: amountToSend }),
            "account already used, pick unique passwords"
        );
    });

    it("no one can override an active account using same hash", async function() {
        await instance.createAccount(passwHash, { from: alice, value: amountToSend });    
        await truffleAssert.reverts(
            instance.createAccount(passwHash,{ from: alice, value: amountToSend }),
            "account already used, pick unique passwords"
        );
    });

    it("no one can create an account using 0 valued hash", async function() {
        await truffleAssert.reverts(
            instance.createAccount(zeroBytes32,{ from: alice, value: amountToSend }),
            "passwordHash should not be empty"
        );
    });

    it("no one can withdraw using 0 value password", async function() {
        await truffleAssert.reverts(
            instance.withdraw(zeroBytes32,{ from: alice}),
            "password should not be empty"
        );
    });

    it("no one can create a hash using 0 value password", async function() {
        await truffleAssert.reverts(
            instance.hashPasswords.sendTransaction(shopAddress, zeroBytes32, { from: carol }),
            "password should not be empty"
        );
    });

    it("no one can validate a hash using 0 value password", async function() {
        await truffleAssert.reverts(
            instance.validateCandidateHash(soliditySha3(shopAddress, zeroBytes32, salt), shopAddress, zeroBytes32, { from: carol }),
            "password should not be empty"
        );
    });

    it("alice(sender) can cancel if it is expired, even passw was zero", async function() {  
         let hash = soliditySha3(shopAddress, zeroBytes32, saltMock);      
         await instanceMock.createAccount(hash, { from: alice, value: amountToSend });
         let txWithDraw = await instanceMock.cancelRemittance(hash, { from: alice});
 
         truffleAssert.eventEmitted(txWithDraw, 'WithdrawEvent', (event) => {
             return event.passwordHash == hash && event.sender == alice && event.amount.toString(10) == amountToSend.toString(10);
         });
    });

});