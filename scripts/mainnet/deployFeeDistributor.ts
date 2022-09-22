import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { getOutputAddress, deployOrLoadAndVerify } from "../utils";

async function main() {
  console.log(`deploying governance to ${network.name}`);

  // const now = Math.floor(Date.now() / 1000);
  const start = 1660780800;
  const e18 = BigNumber.from(10).pow(18);
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  // Get all the deployed smart contracts.
  const mahaCI = await ethers.getContractAt("IERC20", getOutputAddress("MAHA"));
  // const arthCI = await ethers.getContractAt("IERC20", getOutputAddress("ARTH"));
  // const wehtCI = await ethers.getContractAt("IERC20", getOutputAddress("WETH"));
  const sclpCI = await ethers.getContractAt("IERC20", getOutputAddress("SCLP"));

  const mahaxCI = await ethers.getContractAt(
    "MAHAXLocker",
    await getOutputAddress("MAHAXLocker")
  );

  // Deploy fee distributor contracts.
  const mahaFeeI = await deployOrLoadAndVerify(
    "MAHAFeeDistributor",
    "FeeDistributor",
    [mahaxCI.address, start, mahaCI.address]
  );

  // await mahaCI.approve(mahaFeeI.address, e18.mul(100000));

  // await deployOrLoadAndVerify("ARTHFeeDistributor", "FeeDistributor", [
  //   mahaxCI.address,
  //   now,
  //   arthCI.address,
  // ]);

  // await deployOrLoadAndVerify("WETHFeeDistributor", "FeeDistributor", [
  //   mahaxCI.address,
  //   now,
  //   wehtCI.address,
  // ]);

  const sclpFeeI = await deployOrLoadAndVerify(
    "SCLPFeeDistributor",
    "FeeDistributor",
    [mahaxCI.address, start, sclpCI.address]
  );

  // await sclpCI.approve(sclpFeeI.address, e18.mul(100000));

  // mahaFeeI.initRewards(await mahaCI.balanceOf(deployer.address));
  sclpFeeI.initRewards(await sclpCI.balanceOf(deployer.address));

  await deployOrLoadAndVerify("MultiFeeDistributor", "MultiFeeDistributor", []);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
