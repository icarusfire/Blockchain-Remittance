// Promise = require("bluebird");
// const Splitter = artifacts.require("Splitter");
// const truffleAssert = require('truffle-assertions');
// const getBalance = web3.eth.getBalance;
// const getTransaction =  Promise.promisify(web3.eth.getTransaction);
// const { BN, toWei,fromWei } = web3.utils;
// const amountToSend = toWei("0.2", "ether");
// const amountToSendBig = toWei("3.48", "ether");
// const amountToDraw = toWei("0.1", "ether");
//
// const toEther = function(balance) { return fromWei(new BN(balance), 'ether'); }
// const expectedBalanceDifference = function (initialBalance, balance, gasUsed, gasPrice) {
//      return fromWei(new BN(balance)
//         .add(new BN(gasUsed)
//         .mul(gasPrice))
//         .sub(new BN(initialBalance)), 'ether');
//     }
//
// contract('Splitter', (accounts) => {
//     console.log("Current host:", web3.currentProvider.host);
//     let instance;
//     const [ owner, alice, bob, carol] = accounts;
//
//     beforeEach(async function() {
//             instance = await Splitter.new(false, { from: owner } )
//         });
//
//     it("bob and Carol's balances should be 0.1 after receiving a split", function() {
//         return instance.splitEther(bob, carol, { from: alice, value:amountToSend })
//             .then( _ => instance.balances(bob))
//             .then(balanceBob => assert.strictEqual(toEther(balanceBob), '0.1'))
//             .then( _ => instance.balances(carol))
//             .then(balanceCarol => assert.strictEqual(toEther(balanceCarol), '0.1'))
//         });
//
//     it("bob and Carol's balances should be 1.84 after receiving 2 splits", function() {
//         return instance.splitEther(bob, carol, { from: alice, value:amountToSend })
//             .then( _ => instance.splitEther(bob, carol, { from: alice, value:amountToSendBig }))
//             .then( _ => instance.balances(bob))
//             .then(balanceBob => assert.strictEqual(toEther(balanceBob), '1.84'))
//             .then( _ => instance.balances(carol))
//             .then(balanceCarol => assert.strictEqual(toEther(balanceCarol), '1.84'))
//         });
//
//     it("bob can withdraw funds", function() {
//         let gasUsed;
//         let gasPrice;
//         let balanceBobInitial;
//
//         return getBalance(bob)
//             .then(_bobInitalBalance => {
//                 balanceBobInitial = _bobInitalBalance;
//                 return instance.splitEther(bob, carol, {from: alice, value:amountToSend })
//             })
//             .then( _ => instance.withdraw(amountToDraw, { from: bob }))
//             .then(trx => {
//                 gasUsed = trx.receipt.gasUsed;
//                 return getTransaction(trx.tx);
//             })
//             .then(transaction => {
//                 gasPrice = transaction.gasPrice;
//                 return;
//             })
//             .then ( _ => instance.balances(bob))
//             .then(balanceBob => assert.strictEqual(toEther(balanceBob), '0'))
//             .then( _ => getBalance(bob))
//             .then(balanceBob => assert.strictEqual(expectedBalanceDifference(balanceBobInitial, balanceBob, gasUsed, new BN(gasPrice)), '0.1'))
//         });
//
//     it("carol can withdraw funds", function() {
//         let gasUsed;
//         let gasPrice;
//         let balanceCarolInitial;
//
//         return getBalance(carol)
//             .then(_carolInitalBalance => {
//                 balanceCarolInitial = _carolInitalBalance;
//                 return instance.splitEther(bob, carol, {from: alice, value:amountToSend })
//             })
//             .then( _ => instance.withdraw(amountToDraw, { from: carol }))
//             .then(trx => {
//                 gasUsed = trx.receipt.gasUsed;
//                 return getTransaction(trx.tx);
//             })
//             .then(transaction => {
//                 gasPrice = transaction.gasPrice;
//                 return;
//             })
//             .then ( _ => instance.balances(carol))
//             .then(balanceCarol => assert.strictEqual(toEther(balanceCarol), '0'))
//             .then( _ => getBalance(carol))
//             .then(balanceCarol => assert.strictEqual(expectedBalanceDifference(balanceCarolInitial, balanceCarol, gasUsed, new BN(gasPrice)), '0.1'))
//         });
//
//     it("should emit events after splitting Ether", function() {
//         return instance.splitEther(bob, carol,{from: alice, value:amountToSend })
//             .then( tx => {
//                 truffleAssert.eventEmitted(tx, 'LogSplitEvent', (event) => {
//                     return event.recp1 === bob && event.recp2 === carol && event.amountToBeSplitted.cmp(new BN(amountToSend)) === 0 && event.sender === alice;
//                 });
//             })
//         });
//
//     it("should emit events after withdraw", function() {
//         return instance.splitEther(bob, carol, {from: alice, value:amountToSend })
//             .then( _ => instance.withdraw(amountToDraw, { from: bob }))
//             .then( tx => {
//                 truffleAssert.eventEmitted(tx, 'LogWithdrawEvent', (event) => {
//                     return event.amountDrawn.cmp(new BN(amountToDraw)) === 0 && event.sender === bob;
//                 });
//             })
//         });
//
//     it("should emit events after owner changed", function() {
//         return instance.setOwner(bob, {from: owner})
//             .then( tx => {
//                 truffleAssert.eventEmitted(tx, 'OwnerChangedEvent', (event) => {
//                     return event.from === owner && event.to === bob;
//                 });
//             })
//         });
//
//     it("Bob can't pause", async function() {
//             await truffleAssert.reverts(instance.pause( {from: bob} ), "Only owner can execute this action");
//         });
//
//     it("Bob can't kill", async function() {
//             await truffleAssert.reverts(instance.kill( {from: bob} ), "Only owner can execute this action");
//         });
//
//     it("Owner can kill", async function() {
//             await truffleAssert.passes(instance.kill( {from: owner} ));
//         });
//
//     it("should abort with an error when Paused", function() {
//         return instance.pause({ from: owner})
//             .then(truffleAssert.reverts(instance.withdraw(amountToDraw, { from: bob}), "Pausable: paused"))
//             .then(truffleAssert.reverts(instance.splitEther(bob, carol, {from: alice, value:amountToSend }), "Pausable: paused"));
//     });
//
// });
