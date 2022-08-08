import * as fs from "fs";
import hre, { ethers, network } from "hardhat";
import verifyContract from "../verifyContract";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const outputFile: any = {};
  const now = Math.floor(Date.now() / 1000);
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
  const mahaxCF = await ethers.getContractFactory(`MAHAXLocker`);
  const registryCF = await ethers.getContractFactory(`Registry`);
  const emissionControllerCF = await ethers.getContractFactory(
    `EmissionController`
  );
  const voterCF = await ethers.getContractFactory(`BaseV2Voter`);
  const gaugeFactoryCF = await ethers.getContractFactory(`BaseV2GaugeFactory`);
  const bribesFactoryCF = await ethers.getContractFactory(
    `BaseV2BribesFactory`
  );
  const feeDistributorCF = await ethers.getContractFactory("FeeDistributor");
  const mahadaoTimelockControllerCF = await ethers.getContractFactory(
    "TimelockController"
  );
  const mahaxStakerCF = await ethers.getContractFactory("MAHAXStaker");
  const mahaxGovernorCF = await ethers.getContractFactory("MAHAXGovernor");

  // Get all the deployed smart contracts.
  const mahaCI = await ethers.getContractAt(
    "MockERC20",
    "0x106E0c36aD45cEAce8a778fa7365a2ce0500C3a2"
  );
  const arthCI = await ethers.getContractAt(
    "MockERC20",
    "0xbeab728fcc37de548620f17e9a521374f4a35c02"
  );
  const usdcCI = await ethers.getContractAt(
    "MockERC20",
    "0xc003235c028A18E55bacE946E91fAe95769348BB"
  );

  // Deploy all the smart contracts.
  console.log(`Deploying MAHADAO timelock controller`);
  const mahadaoTimelockControllerCI = await mahadaoTimelockControllerCF.deploy(
    1 * 60 * 60,
    [
      deployer.address,
      PROXY_ADMIN,
      "0xF152dA370FA509f08685Fa37a09BA997E41Fb65b",
      "0x0dd44846a3cc5b4D82DCD29D78d7291112608f0c",
    ],
    [
      deployer.address,
      PROXY_ADMIN,
      "0xF152dA370FA509f08685Fa37a09BA997E41Fb65b",
      "0x0dd44846a3cc5b4D82DCD29D78d7291112608f0c",
    ],
    { gasPrice }
  );
  await mahadaoTimelockControllerCI.deployed();

  console.log(`Deploying the registry`);
  const registryCI = await registryCF.deploy({ gasPrice });
  console.log(`tx hash: `, registryCI.deployTransaction.hash);
  await registryCI.deployed();

  console.log(`Deploying the governor`);
  const mahaxGovernorCI = await mahaxGovernorCF.deploy(
    registryCI.address,
    mahadaoTimelockControllerCI.address,
    { gasPrice }
  );
  console.log(`tx hash: `, mahaxGovernorCI.deployTransaction.hash);
  await mahaxGovernorCI.deployed();

  console.log(`Deploying the staker`);
  const mahaxStakerCI = await mahaxStakerCF.deploy(registryCI.address, {
    gasPrice,
  });
  console.log(`tx hash: `, mahaxStakerCI.deployTransaction.hash);
  await mahaxStakerCI.deployed();

  console.log(`Deploying the locker`);
  const mahaxCI = await mahaxCF.deploy(
    registryCI.address,
    deployer.address,
    10000,
    { gasPrice }
  );
  console.log(`tx hash: `, mahaxCI.deployTransaction.hash);
  await mahaxCI.deployed();

  console.log(`Deploying gauge and bribe factories`);
  const gaugeFactoryCI = await gaugeFactoryCF.deploy({ gasPrice });
  await gaugeFactoryCI.deployed();
  console.log(`tx hash: `, gaugeFactoryCI.deployTransaction.hash);

  const bribesFactoryCI = await bribesFactoryCF.deploy({ gasPrice });
  await bribesFactoryCI.deployed();
  console.log(`tx hash: `, bribesFactoryCI.deployTransaction.hash);

  console.log(`Deploying emission controller`);
  const startTime = Math.floor((Date.now() + 20 * 60 * 1000) / 1000);
  const emissionControllerCI = await emissionControllerCF.deploy(
    registryCI.address,
    1 * 60 * 60, // 1 hr period.
    startTime,
    "1000000000000000000",
    { gasPrice }
  );
  await emissionControllerCI.deployed();
  console.log(`tx hash: `, emissionControllerCI.deployTransaction.hash);

  console.log(`Deploying gauge voter`);
  const voterCI = await voterCF.deploy(
    registryCI.address,
    emissionControllerCI.address,
    { gasPrice }
  );
  await voterCI.deployed();
  console.log(`tx hash: `, voterCI.deployTransaction.hash);

  console.log(`Setting contracts in Registry`);
  await registryCI.initialize(
    mahaCI.address,
    voterCI.address,
    mahaxCI.address,
    mahaxGovernorCI.address,
    mahaxStakerCI.address,
    deployer.address,
    { gasPrice }
  );

  // Deploy fee distributor contracts.
  console.log(`Deploying MAHA fee distributor.`);
  const mahaFeeDistributorCI = await feeDistributorCF.deploy(
    mahaxCI.address,
    now,
    mahaCI.address,
    deployer.address,
    PROXY_ADMIN
  );
  await mahaFeeDistributorCI.deployed();
  console.log(`tx hash: `, mahaFeeDistributorCI.deployTransaction.hash);

  console.log(`Deploying ARTH fee distributor.`);
  const arthFeeDistributorCI = await feeDistributorCF.deploy(
    mahaxCI.address,
    now,
    arthCI.address,
    deployer.address,
    PROXY_ADMIN
  );
  await arthFeeDistributorCI.deployed();
  console.log(`tx hash: `, arthFeeDistributorCI.deployTransaction.hash);

  console.log(`Deploying USDC fee distributor.`);
  const usdcFeeDistributorCI = await feeDistributorCF.deploy(
    mahaxCI.address,
    now,
    usdcCI.address,
    deployer.address,
    PROXY_ADMIN
  );
  await usdcFeeDistributorCI.deployed();
  console.log(`tx hash: `, usdcFeeDistributorCI.deployTransaction.hash);

  // Create the output.json file.
  outputFile.ARTH = {
    abi: "MockERC20",
    address: arthCI.address,
  };
  outputFile.MAHAXStaker = {
    abi: "MAHAXStaker",
    address: mahaxStakerCI.address,
  };
  outputFile.MahaDAOTimelockController = {
    abi: "MahaDAOTimelockController",
    address: mahadaoTimelockControllerCI.address,
  };
  outputFile.MAHAXGovernor = {
    abi: "MAHAXGovernor",
    address: mahaxGovernorCI.address,
  };
  outputFile.USDC = {
    abi: "MockERC20",
    address: usdcCI.address,
  };
  outputFile.MAHA = {
    abi: "MockERC20",
    address: mahaCI.address,
  };
  outputFile.MAHALocker = {
    abi: "MAHAX",
    address: mahaxCI.address,
  };
  outputFile.GaugeVoter = {
    abi: "BaseV2Voter",
    address: voterCI.address,
  };
  outputFile.Registry = {
    abi: "Registry",
    address: registryCI.address,
  };
  outputFile.GaugeFactory = {
    abi: "BaseV2GaugeFactory",
    address: gaugeFactoryCI.address,
  };
  outputFile.BribesFactory = {
    abi: "BaseV2BribesFactory",
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
  outputFile.ARTHFeeDistributor = {
    abi: "FeeDistributor",
    address: arthFeeDistributorCI.address,
  };
  outputFile.USDCFeeDistributor = {
    abi: "FeeDistributor",
    address: usdcFeeDistributorCI.address,
  };

  // Save the output file.
  fs.writeFileSync(
    `./output/${network.name}.json`,
    JSON.stringify(outputFile, null, 4)
  );

  // Mint to the emissions controller.
  console.log(`Minting MAHA to EmissionController`);
  await mahaCI.mint(
    emissionControllerCI.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6),
    { gasPrice }
  );

  // Mint fee to fee distributors.
  console.log(`Minting MAHA to Fee distributor`);
  await mahaCI.mint(
    mahaFeeDistributorCI.address,
    ethers.BigNumber.from(10).pow(18).mul(1e6),
    { gasPrice }
  );
  console.log(`Minting ARTH to Fee distributor`);
  await arthCI.mint(
    arthFeeDistributorCI.address,
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
  await verifyContract(hre, mahadaoTimelockControllerCI.address, [
    1 * 60 * 60,
    [
      deployer.address,
      PROXY_ADMIN,
      "0xF152dA370FA509f08685Fa37a09BA997E41Fb65b",
      "0x0dd44846a3cc5b4D82DCD29D78d7291112608f0c",
    ],
    [
      deployer.address,
      PROXY_ADMIN,
      "0xF152dA370FA509f08685Fa37a09BA997E41Fb65b",
      "0x0dd44846a3cc5b4D82DCD29D78d7291112608f0c",
    ],
  ]);

  await verifyContract(hre, registryCI.address, []);

  await verifyContract(hre, mahaxGovernorCI.address, [
    registryCI.address,
    mahadaoTimelockControllerCI.address,
  ]);

  await verifyContract(hre, mahaxStakerCI.address, [registryCI.address]);

  await verifyContract(hre, mahaxCI.address, [
    registryCI.address,
    deployer.address,
    10000,
  ]);

  await verifyContract(hre, gaugeFactoryCI.address, []);
  await verifyContract(hre, bribesFactoryCI.address, []);
  await verifyContract(hre, emissionControllerCI.address, [
    registryCI.address,
    12 * 60 * 60, // 12 hr period.
    startTime,
    "1000000000000000000",
  ]);

  await verifyContract(hre, voterCI.address, [
    registryCI.address,
    emissionControllerCI.address,
    deployer.address,
  ]);

  await verifyContract(hre, mahaFeeDistributorCI.address, [
    mahaxCI.address,
    now,
    mahaCI.address,
    deployer.address,
    PROXY_ADMIN,
  ]);

  await verifyContract(hre, arthFeeDistributorCI.address, [
    mahaxCI.address,
    now,
    arthCI.address,
    deployer.address,
    PROXY_ADMIN,
  ]);

  await verifyContract(hre, usdcFeeDistributorCI.address, [
    mahaxCI.address,
    now,
    usdcCI.address,
    deployer.address,
    PROXY_ADMIN,
  ]);

  console.log(`Governance deployment on ${network.name} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
