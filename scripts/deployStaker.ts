import hre, { ethers, network } from "hardhat";
import verifyContract from "./verifyContract";
import { saveABI } from "./utils";
import { DEPLOYED_REGISTRY } from "./config";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const mahaxCF = await ethers.getContractFactory(`MAHAXStaker`);

  console.log(`Deploying MAHAXStaker implementation...`);
  const staker = await mahaxCF.deploy(DEPLOYED_REGISTRY);
  console.log(
    `Deployed MAHAXStaker at ${staker.address}, ${staker.deployTransaction.hash}\n`
  );
  await verifyContract(hre, staker.address, [DEPLOYED_REGISTRY]);

  saveABI("MAHAXStaker", "MAHAXStaker", staker.address);
  console.log(`Deployment on ${network.name} complete!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
