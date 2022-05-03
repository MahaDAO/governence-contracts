import * as dotenv from "dotenv";

import "@nomiclabs/hardhat-etherscan";
// import "@nomiclabs/hardhat-vyper";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import { HardhatUserConfig, task } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";

dotenv.config();

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
  "polygon-mainnet": 137,
  "polygon-mumbai": 80001,
};

const INFURA_API_KEY = process.env.INFURA_API_KEY || "";

function createTestnetConfig(
  network: keyof typeof chainIds
): NetworkUserConfig {
  const url: string = "https://" + network + ".infura.io/v3/" + INFURA_API_KEY;
  return {
    accounts:
      process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    chainId: chainIds[network],
    url,
  };
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  paths: {
    sources: "./contracts",
  },
  networks: {
    mainnet: createTestnetConfig("mainnet"),
    goerli: createTestnetConfig("goerli"),
    kovan: createTestnetConfig("kovan"),
    rinkeby: createTestnetConfig("rinkeby"),
    ropsten: createTestnetConfig("ropsten"),
    polygonMumbai: createTestnetConfig("polygon-mumbai"),
    polygon: createTestnetConfig("polygon-mainnet"),
  },
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
      {
        version: "0.8.1",
      },
    ],
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
    },
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
  },
  // vyper: {
  //   version: "0.3.1",
  // },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
