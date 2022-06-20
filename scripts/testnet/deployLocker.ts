import * as fs from "fs";
import hre, { ethers, network } from "hardhat";

import { ZERO_ADDRESS } from "../config";
import verifyContract from "../verifyContract";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  // ----- Get the smart contract factories -----

  const mahaxCF = await ethers.getContractFactory(`MAHAX`);
  const registryCF = await ethers.getContractFactory(`Registry`);
  const proxyCF = await ethers.getContractFactory(`AdminUpgradeabilityProxy`);

  // ----- Fetch pre-existing contracts.

  const mahaCI = await ethers.getContractAt(
    "MockERC20",
    "0x7aF163582b3ebAAbB7bce03aaDa8C1d76d655a5c"
  );

  // ----- Deploy smart contracts -----

  const registryCI = await registryCF.deploy(
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    deployer.address,
    { gasPrice }
  );
  console.log(`Registry deployed at: ${registryCI.address}`);
  await verifyContract(hre, registryCI.address, [
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    deployer.address,
  ]);

  const mahaxImplementation = await mahaxCF.deploy({ gasPrice });
  await verifyContract(hre, mahaxImplementation.address, []);

  const PROXY_ADMIN = "0xed74d7941EFb3aec09C02a2db41BCBf195c9216b";
  const proxyCI = await proxyCF.deploy(
    mahaxImplementation.address,
    PROXY_ADMIN,
    [],
    { gasPrice }
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
  await mahaxCI.initialize(registryCI.address, { gasPrice });

  // ----- Link the smart contracts -----

  await registryCI.setMAHA(mahaCI.address, { gasPrice });
  await registryCI.setLocker(mahaxCI.address, { gasPrice });

  // ----- Map the deployment abis and addresses -----

  const outputFile: any = {};

  outputFile.MahaToken = {
    abi: "MockERC20",
    address: mahaCI.address,
  };
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
