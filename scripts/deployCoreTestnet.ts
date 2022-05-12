import * as fs from "fs";
import hre, { ethers, network } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import verifyContract from "./verifyContract";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
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
  const gaugeFactoryCI = await gaugeFactoryCF.deploy({ gasPrice });
  await verifyContract(hre, gaugeFactoryCI.address, []);

  const bribesFactoryCI = await bribesFactoryCF.deploy({ gasPrice });
  await verifyContract(hre, bribesFactoryCI.address, []);

  const mahaCI = await mockTokenCF.deploy("MahaDAO", "MAHA", { gasPrice });
  await verifyContract(hre, mahaCI.address, ["MahaDAO", "MAHA"]);

  const daiCI = await mockTokenCF.deploy("DAI Stablecoin", "DAI", { gasPrice });
  await verifyContract(hre, daiCI.address, ["DAI Stablecoin", "DAI"]);

  const emissionControllerCI = await emissionControllerCF.deploy(
    mahaCI.address,
    30 * 24 * 60 * 60,
    Math.floor((Date.now() + 5 * 60 * 1000) / 1000),
    0,
    { gasPrice }
  );
  await verifyContract(hre, emissionControllerCI.address, [
    mahaCI.address,
    30 * 24 * 60 * 60,
    Math.floor((Date.now() + 5 * 60 * 1000) / 1000),
    0,
  ]);

  const mahaxCI = await mahaxCF.deploy(mahaCI.address, { gasPrice });
  await verifyContract(hre, mahaxCI.address, [mahaCI.address]);

  const voterCI = await voterCF.deploy(
    mahaxCI.address,
    gaugeFactoryCI.address,
    bribesFactoryCI.address,
    emissionControllerCI.address,
    deployer.address,
    { gasPrice }
  );
  await verifyContract(hre, voterCI.address, [
    mahaxCI.address,
    gaugeFactoryCI.address,
    bribesFactoryCI.address,
    emissionControllerCI.address,
  ]);

  // Link the deployed smart contracts.
  await emissionControllerCI.setVoter(voterCI.address, { gasPrice });

  // Mint the default faucet.
  await mahaCI.mint(
    emissionControllerCI.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6),
    { gasPrice }
  );
  await daiCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6),
    { gasPrice }
  );
  await mahaCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6),
    { gasPrice }
  );

  // Create the output.json file.
  outputFile.DAI = {
    abi: "MockERC20",
    address: daiCI.address,
  };
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
  fs.writeFileSync(`./output/${network.name}.json`, JSON.stringify(outputFile));

  console.log(`${network.name} deployment complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
