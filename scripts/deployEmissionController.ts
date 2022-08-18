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

  const factory = await ethers.getContractFactory(`EmissionController`);

  console.log(`Deploying EmissionController implementation...`);
  const _ratePerEpoch = ethers.BigNumber.from(10).pow(18).mul(1e6);
  const impl = await factory.deploy(registry.address, _ratePerEpoch);
  console.log(
    `Deployed EmissionController at ${impl.address}, ${impl.deployTransaction.hash}\n`
  );
  await impl.deployed();
  await wait(20 * 1000);

  await verifyContract(hre, impl.address, [registry.address, _ratePerEpoch]);

  saveABI("EmissionController", "EmissionController", impl.address);
  console.log(`Deployment on ${network.name} complete!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
