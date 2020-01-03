B9Lab Project-2: Remittance 

There are three people: Alice, Bob & Carol.
Alice wants to send funds to Bob, but she only has ether & Bob does not care about Ethereum and wants to be paid in local currency. Luckily, Carol runs an exchange shop that converts ether to local currency.
Therefore, to get the funds to Bob, Alice will allow the funds to be transferred through Carol's exchange shop. Carol will collect the ether from Alice and give the local currency to Bob.

The steps involved in the operation are as follows:

Alice creates a Remittance contract with Ether in it and a puzzle.
Alice sends a one-time-password to Bob; over SMS, say.
Alice sends another one-time-password to Carol; over email, say.
Bob treks to Carol's shop.
Bob gives Carol his one-time-password.
Carol submits both passwords to Alice's remittance contract.
Only when both passwords are correct does the contract yield the Ether to Carol.
Carol gives the local currency to Bob.
Bob leaves.
Alice is notified that the transaction went through.
  
  
Note to self:

ganache-cli --host 0.0.0.0
./node_modules/.bin/truffle migrate
./node_modules/.bin/webpack-cli --mode development
npx http-server ./build/app/ -a 0.0.0.0 -p 8000 -c-1
