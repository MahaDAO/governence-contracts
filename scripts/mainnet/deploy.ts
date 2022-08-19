import hre, { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";
import verifyContract from "../verifyContract";

async function main() {
  console.log(`deploying governance to ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const timelockDuration = 12 * 86400; // 12 days
  const mahaPerEpoch = Math.floor(5000 / 7); // 5000 maha across 1 month

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  console.log(
    `Gas Price: ${ethers.utils.formatUnits(estimateGasPrice, `gwei`)} gwei`
  );

  // Get all the deployed smart contracts.
  const mahaCI = await ethers.getContractAt("IERC20", getOutputAddress("MAHA"));

  // Deploy all the smart contracts.
  const timelockControllerCI = await deployOrLoadAndVerify(
    "TimelockController",
    "TimelockController",
    [timelockDuration, [deployer.address], [deployer.address]]
  );

  const registryCI = await deployOrLoadAndVerify("Registry", "Registry", []);
  const renderingContractCI = await deployOrLoadAndVerify(
    "RenderingContract",
    "RenderingContract",
    []
  );

  const governorCI = await deployOrLoadAndVerify(
    "MAHAXGovernor",
    "MAHAXGovernor",
    [
      registryCI.address,
      timelockControllerCI.address,
      6545, // 1 day voting delay
      26182, // 4 day
      ethers.BigNumber.from(10).pow(18).mul(250), // 250 mahax
      ethers.BigNumber.from(10).pow(18).mul(100000), // 100k mahax quorum
    ]
  );

  const mahaxStakerCI = await deployOrLoadAndVerify(
    "MAHAXStaker",
    "MAHAXStaker",
    [registryCI.address, timelockControllerCI.address]
  );

  const mahaxCI = await deployOrLoadAndVerify("MAHAXLocker", "MAHAXLocker", [
    registryCI.address,
    deployer.address,
    renderingContractCI.address,
    10000,
  ]);

  const emissionControllerCI = await deployOrLoadAndVerify(
    "EmissionController",
    "EmissionController",
    [registryCI.address, ethers.BigNumber.from(10).pow(18).mul(mahaPerEpoch)]
  );

  const voterCI = await deployOrLoadAndVerify("GaugeVoter", "BaseV2Voter", [
    registryCI.address,
  ]);

  console.log(`setting contracts in registry`);
  await registryCI.initialize(
    mahaCI.address,
    voterCI.address,
    mahaxCI.address,
    governorCI.address,
    mahaxStakerCI.address,
    emissionControllerCI.address,
    deployer.address
  );

  console.log(`Verifying contracts:\n`);
  await verifyContract(hre, timelockControllerCI.address, [
    timelockDuration,
    [deployer.address],
    [deployer.address],
  ]);

  await verifyContract(hre, registryCI.address, []);

  await verifyContract(hre, governorCI.address, [
    registryCI.address,
    timelockControllerCI.address,
    100,
    1000,
    ethers.BigNumber.from(10).pow(18).mul(250),
    ethers.BigNumber.from(10).pow(18).mul(1000),
  ]);

  await verifyContract(hre, mahaxStakerCI.address, [
    registryCI.address,
    timelockControllerCI.address,
  ]);

  await verifyContract(hre, mahaxCI.address, [
    registryCI.address,
    deployer.address,
    renderingContractCI.address,
    10000,
  ]);

  await verifyContract(hre, emissionControllerCI.address, [
    registryCI.address,
    "1000000000000000000",
  ]);

  await verifyContract(hre, renderingContractCI.address, []);

  await verifyContract(hre, voterCI.address, [
    registryCI.address,
    deployer.address,
  ]);

  console.log(`Governance deployment on ${network.name} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
