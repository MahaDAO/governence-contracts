import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify } from "../utils";

async function main() {
  console.log(`Deploying on ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const e6 = BigNumber.from(10).pow(6);
  const percentages = [e6];

  await deployOrLoadAndVerify(`FeesSplitter`, "FeesSplitter", [
    ["0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC"],
    percentages, // uint32[] memory _percentAllocations,
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
