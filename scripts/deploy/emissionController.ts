import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const mahaPerEpoch = 2500; // 2500 maha every 2 weeks

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const registry = await getOutputAddress("Registry");

  await deployOrLoadAndVerify("EmissionController", "EmissionController", [
    registry,
    BigNumber.from(10).pow(18).mul(mahaPerEpoch),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
