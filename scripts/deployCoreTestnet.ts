import * as fs from "fs";

import { ethers, network } from "hardhat";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const outputFile: any = {};

  // Get all smart contract factories.
  const mockTokenCF = await ethers.getContractFactory(`MockERC20`);
  const mahaxCF = await ethers.getContractFactory(`MAHAX`);
  const emissionControllerCF = await ethers.getContractFactory(
    `EmissionController`
  );
  const voterCF = await ethers.getContractFactory(`BaseV1Voter`);
  const gaugeFactoryCF = await ethers.getContractFactory(`BaseV1GaugeFactory`);
  const bribesFactoryCF = await ethers.getContractFactory(`BaseV1BribeFactory`);

  // Deploy all the smart contracts.
  const gaugeFactoryCI = await gaugeFactoryCF.deploy();
  const bribesFactoryCI = await bribesFactoryCF.deploy();
  const mahaCI = await mockTokenCF.deploy("MahaDAO", "MAHA");
  const emissionControllerCI = await emissionControllerCF.deploy(
    mahaCI.address,
    30 * 24 * 60 * 60,
    0
  );
  const mahaxCI = await mahaxCF.deploy(mahaCI.address);
  const voterCI = await voterCF.deploy(
    mahaxCI.instance,
    gaugeFactoryCI.address,
    bribesFactoryCI.address,
    emissionControllerCI.address
  );

  // Link the deployed smart contracts.
  await emissionControllerCI.setVoter(voterCI.address);

  // Mint the default faucet.
  await mahaCI.mint(
    emissionControllerCI.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6)
  );
  await mahaCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6)
  );

  // Create the output.json file.
  outputFile.MahaToken = {
    abi: "MockERC20",
    address: mahaCI.address,
  };
  outputFile.VotingEscrow = {
    abi: "MAHAX",
    address: mahaxCI.address,
  };
  outputFile.Voter = {
    abi: "BaseV1Voter",
    address: voterCI.address,
  };

  // Save the output file.
  fs.writeFileSync(`./output/${network.name}.json`, outputFile);

  console.log(`${network.name} deployment complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
