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

  // Get all smart contract factories
  const univ3GaugeContractFactory = await ethers.getContractFactory(
    "BaseGaugeV2UniV3"
  );
  const bribesContractFactory = await ethers.getContractFactory("BaseV2Bribes");

  // Get all the deployed smart contracts.
  const voter = await ethers.getContractAt(
    "BaseV2Voter",
    "0xDd1101865A1D0208993972d36Aa5500cB75dFF49"
  );
  const registry = await ethers.getContractAt(
    "Registry",
    "0xC965e5C1938366751499ff481FcB932868F199E7"
  );
  const poolAddr = "0x8bE3814F675f8CeCbd40ADC9B3B72f221Df4fA4E";

  const uniPositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const tokens = [
    "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  ];

  const fee = 10000;

  const univ3GaugeContractInstance = await univ3GaugeContractFactory.deploy(
    tokens[0],
    tokens[1],
    fee,
    registry.address,
    uniPositionManager,
    { gasPrice }
  );

  await univ3GaugeContractInstance.deployed();

  const bribesInstance = await bribesContractFactory.deploy(registry.address, {
    gasPrice,
  });
  await bribesInstance.deployed();

  console.log("G", univ3GaugeContractInstance.address);
  console.log("B", bribesInstance.address);

  let tx = await voter.toggleWhitelist(univ3GaugeContractInstance.address, {
    gasPrice,
  });
  await tx.wait();
  tx = await voter.toggleWhitelist(bribesInstance.address, {
    gasPrice,
  });
  await tx.wait();

  tx = await voter.registerGauge(
    poolAddr,
    bribesInstance.address,
    univ3GaugeContractInstance.address,
    { gasPrice }
  );
  await tx.wait();

  await verifyContract(hre, univ3GaugeContractInstance.address, [
    tokens[0],
    tokens[1],
    fee,
    registry.address,
    uniPositionManager,
  ]);

  await verifyContract(hre, bribesInstance.address, [registry.address]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
