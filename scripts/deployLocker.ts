import * as fs from "fs";
import hre, { ethers, network } from "hardhat";

import verifyContract from "./verifyContract";
import { ZERO_ADDRESS, MAHA_ADDRESS, PROXY_ADMIN } from "./config";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(5).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  // ----- Get the smart contract factories -----

  const mahaxCF = await ethers.getContractFactory(`MAHAX`);
  const registryCF = await ethers.getContractFactory(`Registry`);
  const proxyCF = await ethers.getContractFactory(`AdminUpgradeabilityProxy`);

  // ----- Deploy smart contracts -----

  console.log(`Deploying registry...`);
  const registryCI = await registryCF.deploy(
    MAHA_ADDRESS,
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    deployer.address,
    ZERO_ADDRESS,
    { gasPrice }
  );
  console.log(
    `Deployed registry at ${registryCI.address}, ${registryCI.deployTransaction.hash}.\n`
  );
  await verifyContract(hre, registryCI.address, [
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    deployer.address,
    ZERO_ADDRESS,
  ]);

  console.log(`Deploying MAHAX implementation...`);
  const mahaxImplementation = await mahaxCF.deploy({ gasPrice });
  console.log(
    `Deployed MAHAX implementation at ${mahaxImplementation.address}, ${mahaxImplementation.deployTransaction.hash}.\n`
  );
  await verifyContract(hre, mahaxImplementation.address, []);

  console.log(`Deploying AdminUpgradeabilityProxy...`);
  const proxyCI = await proxyCF.deploy(
    mahaxImplementation.address,
    PROXY_ADMIN,
    [],
    { gasPrice }
  );
  console.log(
    `Deployed AdminUpgradeabilityProxy at ${proxyCI.address}, ${proxyCI.deployTransaction.hash}.\n`
  );
  await verifyContract(hre, proxyCI.address, [
    mahaxImplementation.address,
    PROXY_ADMIN,
    [],
  ]);

  const mahaxCI = await ethers.getContractAt(
    "MAHAX",
    proxyCI.address,
    deployer
  );
  console.log(`Initializing MAHAX proxy...\n`);
  const tx = await mahaxCI.initialize(registryCI.address, { gasPrice });
  await tx.wait();

  // ----- Link the smart contracts -----

  console.log(`Setting MAHA in Registry...`);
  const tx1 = await registryCI.setMAHA(MAHA_ADDRESS, { gasPrice });
  await tx1.wait();
  console.log(`Setting Locker in Registry...`);
  const tx2 = await registryCI.setLocker(mahaxCI.address, { gasPrice });
  await tx2.wait();

  // ----- Map the deployment abis and addresses -----

  const outputFile: any = {};

  outputFile.VotingEscrow = {
    abi: "MAHAX",
    address: mahaxCI.address,
  };

  // ----- Save the output file -----

  fs.writeFileSync(`./output/${network.name}.json`, JSON.stringify(outputFile));

  console.log(`Deployment on ${network.name} complete!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
