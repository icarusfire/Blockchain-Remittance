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
const { BN, toWei,fromWei, sha3 } = web3.utils;
const amountToSend = toWei("0.2", "ether");

const passw1 = "abcd";
const passw2 = "efgh";
const concanatedPasw = passw1 + passw2;


    //  NOTE: Keccak (unlike bcrypt) is a fast hashing algorithm and not very suitable for password hashing. 
    //  To counter this expiry can be set low like 1 hour and also use a salt (these will be implemented if this solution is valid) 
 
    //  FLOW:
    //  A user creates two passwords   
    //  Then User calculates the passwordHash on their computer(can also be done on frontend via javascript):
    //      passwordHash = keccak256( password1 + password2 )

    //  User e-mails two passwords to the users. And then enters the password hash in the contract by calling this function.


    // Hash can only be calculated if anyone knows both passwords
    // Then they can withdraw. 



describe("Remittance", function() {    
    console.log("Current host:", web3.currentProvider.host);
    let accounts, networkId, passwHash, instance, owner, alice, carol;

    before("get accounts", async function() {
        accounts = await web3.eth.getAccounts();
        networkId = await web3.eth.net.getId();
        Remittance.setNetwork(networkId);

        [owner, alice, bob, carol] = accounts;
    });
    
    beforeEach(async function() {
        instance = await Remittance.new(false, {from: owner} )
        passwHash = await instance.hashPasswords.call(passw1, passw2, { from: carol });  
    });


    it("Anyone can create a keccak hash", async function() {
        assert.strictEqual(passwHash.toString(10), sha3(passw1+passw2));
        _tx = await instance.hashPasswords.sendTransaction(passw1, passw2, { from: carol });
        assert.strictEqual(_tx.receipt['rawLogs'].length, 0);
    });
        
    it("Anyone can create an account", async function() {
        let tx = await instance.createAccount(passwHash, 1,{ from: alice, value:amountToSend });    
        truffleAssert.eventEmitted(tx, 'accountCreatedEvent', (event) => {
            return event.passwordHash == passwHash && event.sender == alice && event.amount.toString(10) == amountToSend.toString(10) && event.isActive == true;
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
            "hash should not be used before, pick unique passwords"
        );
    });

    it("no one can override an active account using same hash", async function() {
        await instance.createAccount(passwHash, 1, { from: alice, value:amountToSend });    
        await truffleAssert.reverts(
            instance.createAccount(passwHash, 1, { from: alice, value:amountToSend }),
            "this account is already activated"
        );
    });

});