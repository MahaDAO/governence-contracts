import hre, { ethers, network } from "hardhat";
import verifyContract, { wait } from "./verifyContract";
import { saveABI, getOutputAddress } from "./utils";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const registry = await ethers.getContractAt(
    "Registry",
    await getOutputAddress("Registry")
  );

  const voterF = await ethers.getContractFactory(`BaseV2Voter`);

  console.log(`Deploying BaseV2Voter implementation...`);
  const voter = await voterF.deploy(registry.address);
  console.log(
    `Deployed BaseV2Voter at ${voter.address}, ${voter.deployTransaction.hash}\n`
  );
  await voter.deployed();
  await wait(20 * 1000);

  await verifyContract(hre, voter.address, [registry.address]);

  saveABI("GaugeVoter", "BaseV2Voter", voter.address);
  console.log(`Deployment on ${network.name} complete!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
