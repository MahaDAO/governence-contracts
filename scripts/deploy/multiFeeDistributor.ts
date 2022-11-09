import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify } from "../utils";

async function main() {
  console.log(`Deploying migrator to ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  await deployOrLoadAndVerify("MultiFeeDistributor", "MultiFeeDistributor", []);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
