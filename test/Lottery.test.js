// contract test code will go here
const assert = require("assert");
const ganache = require("ganache-cli");
const { describe, it, beforeEach } = require("mocha");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const { abi, evm } = require("../compile");

let accounts;
let lottery;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  lottery = await new web3.eth.Contract(abi)
    .deploy({ data: evm.bytecode.object })
    .send({ from: accounts[0], gas: "1000000" });
});

describe("Lottery", () => {
  it("deploys a contract", () => {
    assert.ok(lottery.options.address);
  });

  it("recognizes manager", async () => {
    const manager = await lottery.methods.manager().call({ from: accounts[0] });
    assert.equal(manager, accounts[0]);
  });

  it("enter lottery", async () => {
    await lottery.methods
      .enter()
      .send({ from: accounts[0], value: web3.utils.toWei("0.01", "ether") });

    const players = await lottery.methods
      .getPlayers()
      .call({ from: accounts[0] });

    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it("enter lottery with multiple accounts", async () => {
    await lottery.methods
      .enter()
      .send({ from: accounts[0], value: web3.utils.toWei("0.01", "ether") });

    await lottery.methods
      .enter()
      .send({ from: accounts[1], value: web3.utils.toWei("0.01", "ether") });

    await lottery.methods
      .enter()
      .send({ from: accounts[2], value: web3.utils.toWei("0.01", "ether") });

    const players = await lottery.methods
      .getPlayers()
      .call({ from: accounts[0] });

    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);

    assert.equal(3, players.length);
  });

  it("requires 0.01 ether to enter", async () => {
    try {
      // try to enter with wrong amount
      await lottery.methods.enter().send({ from: accounts[0], value: 20 });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("only manager can call pickWinner", async () => {
    try {
      await lottery.methods.pickWinner().send({ from: accounts[1] });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("a player can not enter the same lottery twice", async () => {
    try {
      await lottery.methods
        .enter()
        .send({ from: accounts[0], value: web3.utils.toWei("0.01", "ether") });

      await lottery.methods
        .enter()
        .send({ from: accounts[0], value: web3.utils.toWei("0.01", "ether") });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("winner address can be accessed after picking winner", async () => {
    try {
      // enter lottery
      await lottery.methods
        .enter()
        .send({ from: accounts[0], value: web3.utils.toWei("0.01", "ether") });
      // pick winner (there is only 1 player)
      await lottery.methods.pickWinner().send({ from: accounts[0] });

      const winnerAddress = await lottery.methods
        .getWinner(1)
        .call({ from: accounts[0] });

      assert.equal(accounts[0], winnerAddress);
    } catch (err) {
      assert(err);
    }
  });

  it("winner address can not be queried with invalid lottery id", async () => {
    try {
      const winnerAddress = await lottery.methods
        .getWinner(2)
        .call({ from: accounts[0] });

      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("sends money to the winner, resets player array and increments lotteryIdx", async () => {
    // enter lottery
    await lottery.methods
      .enter()
      .send({ from: accounts[0], value: web3.utils.toWei("0.01", "ether") });
    //get balance after entering
    const initialBalance = await web3.eth.getBalance(accounts[0]);
    // pick winner (there is only 1 player)
    await lottery.methods.pickWinner().send({ from: accounts[0] });
    // get final balance
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    // final balance should be bigger than initial balance
    assert(finalBalance > initialBalance);
    // players array should be cleared
    const players = await lottery.methods
      .getPlayers()
      .call({ from: accounts[0] });

    assert.equal(0, players.length);

    // lottery idx should be incremented by one
    const finalLotteryIdx = await lottery.methods.lotteryIdx().call({
      from: accounts[0],
    });
    assert.equal(2, finalLotteryIdx);
  });
});
