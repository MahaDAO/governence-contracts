import * as fs from "fs";
import hre, { ethers, network } from "hardhat";

import verifyContract from "../verifyContract";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const [deployer] = await ethers.getSigners();
  const PROXY_ADMIN = "0xed74d7941EFb3aec09C02a2db41BCBf195c9216b";
  console.log(
    `Deployer address is ${deployer.address}, Proxy admin is ${PROXY_ADMIN}`
  );

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  // Get all smart contract factories.
  const univ2GaugeContractFactory = await ethers.getContractFactory(
    "BaseGaugeV2"
  );
  const bribesContractFactory = await ethers.getContractFactory("BaseV2Bribes");

  // Get all the deployed smart contracts.
  const mahaCI = await ethers.getContractAt(
    "MockERC20",
    "0xAaA6a7A5d7eC7C7691576D557E1D2CDaBeca6C4A"
  );
  const solidCI = await ethers.getContractAt(
    "MockERC20",
    "0xD09cb6c1aAb18239B7C0880BFcfaAbca461cBac3"
  );
  const daiCI = await ethers.getContractAt(
    "MockERC20",
    "0xbAE4E07480f16d82Bc13850C36631C21861E245b"
  );
  const usdcCI = await ethers.getContractAt(
    "MockERC20",
    "0x3e922459b8D5956E3c886aCA472688F811821F6b"
  );

  const univ2GaugeContractInstance = await univ2GaugeContractFactory.deploy(
    "0xe3aAd64Bdc20770C12A0D09cBf26bE9c30587408",
    "0xac595de42aA6c820A25bd2f8A0122912F532B816",
    { gasPrice }
  );

  await univ2GaugeContractInstance.deployed();

  const bribesInstance = await bribesContractFactory.deploy(
    "0xac595de42aA6c820A25bd2f8A0122912F532B816",
    { gasPrice }
  );
  await bribesInstance.deployed();

  console.log("G", univ2GaugeContractInstance.address);
  console.log("B", bribesInstance.address);

  await verifyContract(hre, univ2GaugeContractInstance.address, [
    "0xd09330f48cf6f41f70f708710a21e015b8b66781",
    "0xac595de42aA6c820A25bd2f8A0122912F532B816",
  ]);

  await verifyContract(hre, bribesInstance.address, [
    "0xac595de42aA6c820A25bd2f8A0122912F532B816",
  ]);

  // Mint fee to fee distributors.
  console.log(`Minting MAHA to Fee distributor`);
  await mahaCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(18).mul(1e8),
    { gasPrice }
  );
  console.log(`Minting DAI to Fee distributor`);
  await daiCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(18).mul(1e8),
    { gasPrice }
  );
  console.log(`Minting SOLID to Fee distributor`);
  await solidCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(18).mul(1e8),
    { gasPrice }
  );
  console.log(`Minting USDC to Fee distributor`);
  await usdcCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(6).mul(1e8),
    { gasPrice }
  );

  console.log(`Governance deployment on ${network.name} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
