import hre, { ethers, network } from "hardhat";
import verifyContract from "./verifyContract";
import { saveABI } from "./utils";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const registry = "0x270Cb299Bd822A856c0599235b3ABdd1B42afe85";
  const mahaxCF = await ethers.getContractFactory(`MAHAXStaker`);

  console.log(`Deploying MAHAXStaker implementation...`);
  const staker = await mahaxCF.deploy(registry);
  console.log(
    `Deployed MAHAXStaker at ${staker.address}, ${staker.deployTransaction.hash}\n`
  );
  await verifyContract(hre, staker.address, [registry]);

  saveABI("MAHAXStaker", "MAHAXStaker", staker.address);
  console.log(`Deployment on ${network.name} complete!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
