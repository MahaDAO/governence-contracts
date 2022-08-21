import { ethers, network } from "hardhat";
import { getOutputAddress, deployOrLoadAndVerify } from "../utils";

async function main() {
  console.log(`deploying governance to ${network.name}`);

  const now = Math.floor(Date.now() / 1000);
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  // Get all the deployed smart contracts.
  const mahaCI = await ethers.getContractAt("IERC20", getOutputAddress("MAHA"));
  const arthCI = await ethers.getContractAt("IERC20", getOutputAddress("ARTH"));
  const wehtCI = await ethers.getContractAt("IERC20", getOutputAddress("WETH"));
  const sclpCI = await ethers.getContractAt("IERC20", getOutputAddress("SCLP"));

  const mahaxCI = await ethers.getContractAt(
    "MAHAXLocker",
    await getOutputAddress("MAHAXLocker")
  );

  // Deploy fee distributor contracts.
  await deployOrLoadAndVerify("MAHAFeeDistributor", "FeeDistributor", [
    mahaxCI.address,
    now,
    mahaCI.address,
    deployer.address,
    deployer.address,
  ]);

  await deployOrLoadAndVerify("ARTHFeeDistributor", "FeeDistributor", [
    mahaxCI.address,
    now,
    arthCI.address,
    deployer.address,
    deployer.address,
  ]);

  await deployOrLoadAndVerify("WETHFeeDistributor", "FeeDistributor", [
    mahaxCI.address,
    now,
    wehtCI.address,
    deployer.address,
    deployer.address,
  ]);

  await deployOrLoadAndVerify("SCLPFeeDistributor", "FeeDistributor", [
    mahaxCI.address,
    now,
    sclpCI.address,
    deployer.address,
    deployer.address,
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
