const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const { abi, evm } = require("./compile");
require("dotenv").config();

const provider = new HDWalletProvider(
  process.env.walletMnemonic,
  process.env.rinkebyEndpoint
);

const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();
  console.log("Attempting to deploy from account: ", accounts[0]);

  const result = await new web3.eth.Contract(abi)
    .deploy({ data: evm.bytecode.object })
    .send({ from: accounts[0], gas: "1000000" });

  console.log(abi);
  console.log("Contract deployed to: ", result.options.address);
  provider.engine.stop();
};

deploy();

//0xB0c8F1420f8425201B773e20dCf251F4DDC71EF3
