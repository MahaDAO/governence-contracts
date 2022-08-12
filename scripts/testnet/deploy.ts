import hre, { ethers, network } from "hardhat";
import { getOutputAddress, saveABI } from "../utils";
import verifyContract from "../verifyContract";

async function main() {
  console.log(`deploying governance to ${network.name}`);

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
    "EmissionController"
  );
  const voterCF = await ethers.getContractFactory(`BaseV2Voter`);
  const gaugeFactoryCF = await ethers.getContractFactory(`BaseV2GaugeFactory`);
  const bribesFactoryCF = await ethers.getContractFactory(
    "BaseV2BribesFactory"
  );
  const feeDistributorCF = await ethers.getContractFactory("FeeDistributor");
  const timelockControllerCF = await ethers.getContractFactory(
    "TimelockController"
  );
  const mahaxStakerCF = await ethers.getContractFactory("MAHAXStaker");
  const mahaxGovernorCF = await ethers.getContractFactory("MAHAXGovernor");

  // Get all the deployed smart contracts.
  const mahaCI = await ethers.getContractAt(
    "MockERC20",
    getOutputAddress("MAHA")
  );
  const arthCI = await ethers.getContractAt(
    "MockERC20",
    getOutputAddress("ARTH")
  );
  const usdcCI = await ethers.getContractAt(
    "MockERC20",
    getOutputAddress("USDC")
  );

  // Deploy all the smart contracts.
  console.log(`deploying timelock controller`);
  const timelockControllerCI = await timelockControllerCF.deploy(
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
  await timelockControllerCI.deployed();

  console.log(`deploying registry`);
  const registryCI = await registryCF.deploy({ gasPrice });
  console.log(`tx hash: `, registryCI.deployTransaction.hash);
  await registryCI.deployed();

  console.log(`deploying governor`);
  const governorCI = await mahaxGovernorCF.deploy(
    registryCI.address,
    timelockControllerCI.address,
    { gasPrice }
  );
  console.log(`tx hash: `, governorCI.deployTransaction.hash);
  await governorCI.deployed();

  console.log(`deploying staker`);
  const mahaxStakerCI = await mahaxStakerCF.deploy(registryCI.address, {
    gasPrice,
  });
  console.log(`tx hash: `, mahaxStakerCI.deployTransaction.hash);
  await mahaxStakerCI.deployed();

  console.log(`deploying locker`);
  const mahaxCI = await mahaxCF.deploy(
    registryCI.address,
    deployer.address,
    10000,
    { gasPrice }
  );
  console.log(`tx hash: `, mahaxCI.deployTransaction.hash);
  await mahaxCI.deployed();

  console.log(`deploying gauge and bribe factories`);
  const gaugeFactoryCI = await gaugeFactoryCF.deploy({ gasPrice });
  await gaugeFactoryCI.deployed();
  console.log(`tx hash: `, gaugeFactoryCI.deployTransaction.hash);

  const bribesFactoryCI = await bribesFactoryCF.deploy({ gasPrice });
  await bribesFactoryCI.deployed();
  console.log(`tx hash: `, bribesFactoryCI.deployTransaction.hash);

  console.log(`deploying emission controller`);
  const emissionControllerCI = await emissionControllerCF.deploy(
    registryCI.address,
    "1000000000000000000",
    { gasPrice }
  );
  await emissionControllerCI.deployed();
  console.log(`tx hash: `, emissionControllerCI.deployTransaction.hash);

  console.log(`deploying gauge voter`);
  const voterCI = await voterCF.deploy(registryCI.address, { gasPrice });
  await voterCI.deployed();
  console.log(`tx hash: `, voterCI.deployTransaction.hash);

  console.log(`setting contracts in registry`);
  await registryCI.initialize(
    mahaCI.address,
    voterCI.address,
    mahaxCI.address,
    governorCI.address,
    mahaxStakerCI.address,
    emissionControllerCI.address,
    deployer.address,
    { gasPrice }
  );

  // Deploy fee distributor contracts.
  console.log(`deploying MAHA fee distributor.`);
  const mahaFeeDistributorCI = await feeDistributorCF.deploy(
    mahaxCI.address,
    now,
    mahaCI.address,
    deployer.address,
    PROXY_ADMIN
  );
  await mahaFeeDistributorCI.deployed();
  console.log(`tx hash: `, mahaFeeDistributorCI.deployTransaction.hash);

  console.log(`deploying ARTH fee distributor.`);
  const arthFeeDistributorCI = await feeDistributorCF.deploy(
    mahaxCI.address,
    now,
    arthCI.address,
    deployer.address,
    PROXY_ADMIN
  );
  await arthFeeDistributorCI.deployed();
  console.log(`tx hash: `, arthFeeDistributorCI.deployTransaction.hash);

  console.log(`deploying WETH fee distributor.`);
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

  await saveABI("MAHAXStaker", "MAHAXStaker", mahaxStakerCI.address);
  await saveABI(
    "TimelockController",
    "TimelockController",
    timelockControllerCI.address
  );
  await saveABI("MAHAXGovernor", "MAHAXGovernor", governorCI.address);
  await saveABI("MAHALocker", "MAHAXLocker", mahaxCI.address);
  await saveABI("GaugeVoter", "BaseV2Voter", voterCI.address);
  await saveABI("Registry", "IRegistry", registryCI.address);
  await saveABI("GaugeFactory", "IGaugeFactory", gaugeFactoryCI.address);
  await saveABI("BribesFactory", "IBribeFactory", bribesFactoryCI.address);
  await saveABI(
    "EmissionController",
    "IEmissionController",
    emissionControllerCI.address
  );
  await saveABI(
    "MAHAFeeDistributor",
    "FeeDistributor",
    mahaFeeDistributorCI.address
  );
  await saveABI(
    "ARTHFeeDistributor",
    "FeeDistributor",
    arthFeeDistributorCI.address
  );
  await saveABI(
    "USDCFeeDistributor",
    "FeeDistributor",
    usdcFeeDistributorCI.address
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
  await verifyContract(hre, timelockControllerCI.address, [
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

  await verifyContract(hre, governorCI.address, [
    registryCI.address,
    timelockControllerCI.address,
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
    deployer.address,
  ]);

  await verifyContract(hre, mahaFeeDistributorCI.address, [
    mahaxCI.address,
    now,
    mahaCI.address,
    deployer.address,
    PROXY_ADMIN,
  ]);

  // await verifyContract(hre, arthFeeDistributorCI.address, [
  //   mahaxCI.address,
  //   now,
  //   arthCI.address,
  //   deployer.address,
  //   PROXY_ADMIN,
  // ]);

  // await verifyContract(hre, usdcFeeDistributorCI.address, [
  //   mahaxCI.address,
  //   now,
  //   usdcCI.address,
  //   deployer.address,
  //   PROXY_ADMIN,
  // ]);

  console.log(`Governance deployment on ${network.name} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
