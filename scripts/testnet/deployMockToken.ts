import * as fs from "fs";
import hre, { ethers, network } from "hardhat";

import verifyContract from "../verifyContract";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  const args: any[] = ["USDC Mock", "USDC", 6];
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const instance = await MockERC20.deploy(args[0], args[1], args[2], {
    gasPrice,
  });

  console.log("tx sent", instance.deployTransaction.hash);
  await instance.deployed();
  await verifyContract(hre, instance.address, args);
  console.log(`mock token deployed on ${network.name} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
