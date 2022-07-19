import hre, { ethers, network } from "hardhat";
import { saveABI } from "./utils";
import verifyContract from "./verifyContract";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(5).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  // ----- Deploy smart contracts -----

  console.log(`Deploying registry...`);
  const registryCF = await ethers.getContractFactory(`Registry`);
  const registryCI = await registryCF.deploy();
  console.log(
    `Deployed registry at ${registryCI.address}, ${registryCI.deployTransaction.hash}.\n`
  );
  saveABI("Registry", "Registry", registryCI.address);
  await verifyContract(hre, registryCI.address, []);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
