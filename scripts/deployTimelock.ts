import hre, { ethers, network } from "hardhat";
import verifyContract from "./verifyContract";
import { saveABI } from "./utils";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const delay = 86400 * 12;
  const timelockF = await ethers.getContractFactory(`TimelockController`);

  console.log(`Deploying TimelockController implementation...`);
  const timelock = await timelockF.deploy(
    delay, // uint256 minDelay,
    [], // address[] memory proposers,
    [] // address[] memory executors
  );
  console.log(
    `Deployed TimelockController at ${timelock.address}, ${timelock.deployTransaction.hash}\n`
  );
  await verifyContract(hre, timelock.address, [delay, [], []]);

  saveABI("TimelockController", "TimelockController", timelock.address);
  console.log(`Deployment on ${network.name} complete!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
