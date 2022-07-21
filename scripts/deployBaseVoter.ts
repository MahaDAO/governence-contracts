import hre, { ethers, network } from "hardhat";
import verifyContract from "./verifyContract";
import { saveABI } from "./utils";
import { DEPLOYED_REGISTRY, ZERO_ADDRESS } from "./config";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const voterF = await ethers.getContractFactory(`BaseV2Voter`);

  console.log(`Deploying BaseV2Voter implementation...`);
  const voter = await voterF.deploy(DEPLOYED_REGISTRY, ZERO_ADDRESS);
  console.log(
    `Deployed BaseV2Voter at ${voter.address}, ${voter.deployTransaction.hash}\n`
  );
  await verifyContract(hre, voter.address, [DEPLOYED_REGISTRY, ZERO_ADDRESS]);

  saveABI("GaugeVoter", "BaseV2Voter", voter.address);
  console.log(`Deployment on ${network.name} complete!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
