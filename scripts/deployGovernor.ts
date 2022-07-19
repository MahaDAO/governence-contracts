import hre, { ethers, network } from "hardhat";
import verifyContract from "./verifyContract";
import { saveABI } from "./utils";
import { DEPLOYED_REGISTRY, DEPLOYED_TIMELOCK } from "./config";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const governorF = await ethers.getContractFactory(`MAHAXGovernor`);

  console.log(`Deploying MAHAXGovernor implementation...`);
  const governor = await governorF.deploy(DEPLOYED_REGISTRY, DEPLOYED_TIMELOCK);
  console.log(
    `Deployed MAHAXGovernor at ${governor.address}, ${governor.deployTransaction.hash}\n`
  );
  await verifyContract(hre, governor.address, [
    DEPLOYED_REGISTRY,
    DEPLOYED_TIMELOCK,
  ]);

  saveABI("MAHAXGovernor", "MAHAXGovernor", governor.address);
  console.log(`Deployment on ${network.name} complete!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
