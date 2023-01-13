import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify } from "../utils";

async function main() {
  console.log(`deploying governance to ${network.name}`);

  const [deployer] = await ethers.getSigners();

  console.log(`Deployer address is ${deployer.address}`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  // Get all the deployed smart contracts.
  const mahaCI = await deployOrLoadAndVerify("MAHA", "MockERC20", [
    "MAHA",
    "MAHA",
    18,
  ]);

  const arthCI = await deployOrLoadAndVerify("ARTH", "MockERC20", [
    "ARTH",
    "ARTH",
    18,
  ]);

  // Deploy all the smart contracts.
  const timelockControllerCI = await deployOrLoadAndVerify(
    "MAHATimelockController",
    "MAHATimelockController",
    [
      60 * 60, // uint256 minDelay,
      deployer.address, // address admin,
      [deployer.address], // address[] memory proposers,
      [deployer.address], // address[] memory cancellors,
      [deployer.address], // address[] memory executors
    ]
  );

  const registryCI = await deployOrLoadAndVerify("Registry", "Registry", []);
  const renderingContractCI = await deployOrLoadAndVerify(
    "RenderingContract",
    "RenderingContract",
    []
  );

  console.log(`deploying governor`);
  const governorCI = await deployOrLoadAndVerify(
    "MAHAXGovernor",
    "MAHAXGovernor",
    [
      registryCI.address,
      timelockControllerCI.address,
      100,
      1000,
      ethers.BigNumber.from(10).pow(18).mul(250),
      ethers.BigNumber.from(10).pow(18).mul(1000), // 1000 maha quorum
      100,
    ]
  );

  console.log(`deploying staker`);
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
    [registryCI.address, "1000000000000000000"]
  );

  const voterCI = await deployOrLoadAndVerify("BaseV2Voter", "BaseV2Voter", []);

  // Deploy fee distributor contracts.
  console.log(`deploying MAHA fee distributor.`);
  // const mahaFeeDistributorCI = await deployOrLoadAndVerify(
  //   "MAHAFeeDistributor",
  //   "FeeDistributor",
  //   [mahaxCI.address, mahaCI.address, deployer.address]
  // );

  // const arthFeeDistributorCI = await deployOrLoadAndVerify(
  //   "ARTHFeeDistributor",
  //   "FeeDistributor",
  //   [mahaxCI.address, arthCI.address, deployer.address]
  // );

  console.log("init voter");
  await voterCI.initialize(registryCI.address, deployer.address);

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

  // // Mint to the emissions controller.
  // console.log(`Minting MAHA to EmissionController`);
  // await mahaCI.mint(
  //   emissionControllerCI.address,
  //   ethers.BigNumber.from(10).pow(18).mul(1e6),
  //   { gasPrice }
  // );

  // // Mint fee to fee distributors.
  // console.log(`Minting MAHA to Fee distributor`);
  // await mahaCI.mint(
  //   mahaFeeDistributorCI.address,
  //   ethers.BigNumber.from(10).pow(18).mul(1e6),
  //   { gasPrice }
  // );
  // console.log(`Minting ARTH to Fee distributor`);
  // await arthCI.mint(
  //   arthFeeDistributorCI.address,
  //   ethers.BigNumber.from(10).pow(18).mul(1e6),
  //   { gasPrice }
  // );

  console.log(`Governance deployment on ${network.name} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
