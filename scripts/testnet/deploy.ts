import * as fs from "fs";
import hre, { ethers, network } from "hardhat";

import { ZERO_ADDRESS } from "../config";
import verifyContract from "../verifyContract";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const outputFile: any = {};
  const [deployer] = await ethers.getSigners();
  const PROXY_ADMIN = "0xed74d7941EFb3aec09C02a2db41BCBf195c9216b";
  console.log(
    `Deployer address is ${deployer.address}, Proxy admin is ${PROXY_ADMIN}`
  );

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  // Get all smart contract factories.
  const mahaxCF = await ethers.getContractFactory(`MAHAX`);
  const registryCF = await ethers.getContractFactory(`Registry`);
  const mockTokenCF = await ethers.getContractFactory(`MockERC20`);
  const proxyCF = await ethers.getContractFactory(`AdminUpgradeabilityProxy`);
  const emissionControllerCF = await ethers.getContractFactory(
    `EmissionController`
  );
  const voterCF = await ethers.getContractFactory(`BaseV1Voter`);
  const gaugeFactoryCF = await ethers.getContractFactory(`BaseV1GaugeFactory`);
  const bribesFactoryCF = await ethers.getContractFactory(`BaseV1BribeFactory`);
  const feeDistributorCF = await ethers.getContractFactory("FeeDistributor");

  // Get all the deployed smart contracts.
  const mahaCI = await mockTokenCF.deploy("MahaDAO", "MAHA", 18, { gasPrice });
  const solidCI = await mockTokenCF.deploy("SOLID", "SOLID", 18, {
    gasPrice,
  });
  const daiCI = await mockTokenCF.deploy("Dai Stablecoin", "DAI", 18, {
    gasPrice,
  });
  const usdcCI = await mockTokenCF.deploy("USDC", "USDC", 6, {
    gasPrice,
  });

  // Deploy all the smart contracts.
  console.log(`Deploying the registry`);
  const registryCI = await registryCF.deploy(
    mahaCI.address,
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    deployer.address,
    { gasPrice }
  );
  await registryCI.deployed();

  console.log(`Deploying MAHAX implementation`);
  const mahaxImplementation = await mahaxCF.deploy({ gasPrice });
  await mahaxImplementation.deployed();

  console.log(`Deploying AdminUpgradeabilityProxy`);
  const proxyCI = await proxyCF.deploy(
    mahaxImplementation.address,
    PROXY_ADMIN,
    [],
    { gasPrice }
  );
  await proxyCI.deployed();

  // Loading proxy with mahax abi.
  const mahaxCI = await ethers.getContractAt(
    "MAHAX",
    proxyCI.address,
    deployer
  );

  console.log(`Initializing MAHAX proxy`);
  const tx = await mahaxCI.initialize(registryCI.address, { gasPrice });
  await tx.wait();

  console.log(`Deploying gauge and bribe factories`);
  const gaugeFactoryCI = await gaugeFactoryCF.deploy({ gasPrice });
  await gaugeFactoryCI.deployed();
  const bribesFactoryCI = await bribesFactoryCF.deploy({ gasPrice });
  await bribesFactoryCI.deployed();

  console.log(`Deploying emission controller`);
  const emissionControllerCI = await emissionControllerCF.deploy(
    mahaCI.address,
    12 * 60 * 60, // 12 hr period.
    Math.floor((Date.now() + 20 * 60 * 1000) / 1000),
    0,
    { gasPrice }
  );
  await emissionControllerCI.deployed();

  const voterCI = await voterCF.deploy(
    registryCI.address,
    emissionControllerCI.address,
    deployer.address,
    { gasPrice }
  );
  await voterCI.deployed();

  console.log(`Setting MAHA in Registry`);
  const tx2 = await registryCI.setMAHA(mahaCI.address, { gasPrice });
  await tx2.wait();
  console.log(`Setting Locker in Registry`);
  const tx3 = await registryCI.setLocker(mahaxCI.address, { gasPrice });
  await tx3.wait();
  console.log(`Setting Voter in Registry`);
  const tx4 = await registryCI.setVoter(voterCI.address, { gasPrice });
  await tx4.wait();

  // Deploy fee distributor contracts.
  console.log(`Deploying MAHA fee distributor.`);
  const mahaFeeDistributorCI = await feeDistributorCF.deploy(
    mahaxCI.address,
    Math.floor(Date.now() / 1000),
    mahaCI.address,
    deployer.address,
    PROXY_ADMIN
  );
  await mahaFeeDistributorCI.deployed();

  console.log(`Deploying DAI fee distributor.`);
  const daiFeeDistributorCI = await feeDistributorCF.deploy(
    mahaxCI.address,
    Math.floor(Date.now() / 1000),
    daiCI.address,
    deployer.address,
    PROXY_ADMIN
  );
  await daiFeeDistributorCI.deployed();

  console.log(`Deploying SOLID fee distributor.`);
  const solidFeeDistributorCI = await feeDistributorCF.deploy(
    mahaxCI.address,
    Math.floor(Date.now() / 1000),
    solidCI.address,
    deployer.address,
    PROXY_ADMIN
  );
  await solidFeeDistributorCI.deployed();

  console.log(`Deploying USDC fee distributor.`);
  const usdcFeeDistributorCI = await feeDistributorCF.deploy(
    mahaxCI.address,
    Math.floor(Date.now() / 1000),
    usdcCI.address,
    deployer.address,
    PROXY_ADMIN
  );
  await usdcFeeDistributorCI.deployed();

  // Mint the default faucet.
  console.log(`Minting MAHA to EmissionController`);
  await mahaCI.mint(
    emissionControllerCI.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6),
    { gasPrice }
  );

  console.log(`Minting MAHA to Deployer`);
  await mahaCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6),
    { gasPrice }
  );
  console.log(`Minting DAI to Deployer`);
  await daiCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6),
    { gasPrice }
  );
  console.log(`Minting SOLID to Deployer`);
  await solidCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6),
    { gasPrice }
  );
  console.log(`Minting USDC to Deployer`);
  await usdcCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(6).mul(1e6),
    { gasPrice }
  );

  // Create the output.json file.
  outputFile.DAI = {
    abi: "MockERC20",
    address: daiCI.address,
  };
  outputFile.USDC = {
    abi: "MockERC20",
    address: usdcCI.address,
  };
  outputFile.SOLID = {
    abi: "MockERC20",
    address: solidCI.address,
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
  outputFile.Registry = {
    abi: "Registry",
    address: registryCI.address,
  };
  outputFile.MAHAXImplementation = {
    abi: "MAHAX",
    address: mahaxImplementation.address,
  };
  outputFile.GaugeFactory = {
    abi: "BaseV1GaugeFactory",
    address: gaugeFactoryCI.address,
  };
  outputFile.BribesFactory = {
    abi: "BaseV1BribeFactory",
    address: bribesFactoryCI.address,
  };
  outputFile.EmissionController = {
    abi: "EmissionController",
    address: emissionControllerCI.address,
  };
  outputFile.MAHAFeeDistributor = {
    abi: "FeeDistributor",
    address: mahaFeeDistributorCI.address,
  };
  outputFile.DAIFeeDistributor = {
    abi: "FeeDistributor",
    address: daiFeeDistributorCI.address,
  };
  outputFile.SOLIDFeeDistributor = {
    abi: "FeeDistributor",
    address: solidFeeDistributorCI.address,
  };
  outputFile.USDCFeeDistributor = {
    abi: "FeeDistributor",
    address: usdcFeeDistributorCI.address,
  };

  // Mint fee to fee distributors.
  console.log(`Minting MAHA to Fee distributor`);
  await mahaCI.mint(
    mahaFeeDistributorCI.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6),
    { gasPrice }
  );
  console.log(`Minting DAI to Fee distributor`);
  await daiCI.mint(
    daiFeeDistributorCI.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6),
    { gasPrice }
  );
  console.log(`Minting SOLID to Fee distributor`);
  await solidCI.mint(
    solidFeeDistributorCI.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6),
    { gasPrice }
  );
  console.log(`Minting USDC to Fee distributor`);
  await usdcCI.mint(
    usdcFeeDistributorCI.address,
    ethers.BigNumber.from(10).pow(6).mul(1e6),
    { gasPrice }
  );

  console.log(`Verifying contracts:\n`);
  await verifyContract(hre, registryCI.address, [
    mahaCI.address,
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    deployer.address,
  ]);
  await verifyContract(hre, mahaxImplementation.address, []);

  await verifyContract(hre, proxyCI.address, [
    mahaxImplementation.address,
    PROXY_ADMIN,
    [],
  ]);
  await verifyContract(hre, gaugeFactoryCI.address, []);
  await verifyContract(hre, bribesFactoryCI.address, []);
  await verifyContract(hre, emissionControllerCI.address, [
    mahaCI.address,
    12 * 60 * 60, // 12 hr period.
    Math.floor((Date.now() + 20 * 60 * 1000) / 1000),
    0,
  ]);

  await verifyContract(hre, mahaFeeDistributorCI.address, [
    mahaxCI.address,
    Math.floor(Date.now() / 1000),
    mahaCI.address,
    deployer.address,
    PROXY_ADMIN,
  ]);

  await verifyContract(hre, daiFeeDistributorCI.address, [
    mahaxCI.address,
    Math.floor(Date.now() / 1000),
    daiCI.address,
    deployer.address,
    PROXY_ADMIN,
  ]);

  await verifyContract(hre, solidFeeDistributorCI.address, [
    mahaxCI.address,
    Math.floor(Date.now() / 1000),
    solidCI.address,
    deployer.address,
    PROXY_ADMIN,
  ]);
  await verifyContract(hre, solidFeeDistributorCI.address, [
    mahaxCI.address,
    Math.floor(Date.now() / 1000),
    usdcCI.address,
    deployer.address,
    PROXY_ADMIN,
  ]);

  await verifyContract(hre, voterCI.address, [
    registryCI.address,
    emissionControllerCI.address,
    deployer.address,
  ]);

  // Save the output file.
  fs.writeFileSync(
    `./output/${network.name}.json`,
    JSON.stringify(outputFile, null, 4)
  );

  console.log(`Governance deployment on ${network.name} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
