const Migrations = artifacts.require("Migrations");

module.exports = function(deployer, network, accounts) {
  console.log("network:", network);
  console.log("accounts:", accounts);
  deployer.deploy(Migrations);
};
