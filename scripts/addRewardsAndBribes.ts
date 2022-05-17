import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  const gauge = await ethers.getContractAt(
    "BaseGaugeV1",
    "0x8975B4Db0A2Ffb619Ac14Da68cc5AD5f3a33B2B5"
  );
  // const bribe = await ethers.getContractAt(
  //   "BaseV1Bribes",
  //   "0x1A024C2F7Fe5D267E22834c676560b71BEAba6F7"
  // );
  const amount = BigNumber.from(10).pow(18).mul(1e3);

  // const solid = await ethers.getContractAt(
  //   "MockERC20",
  //   "0x62C33009b62B1e972c01820Ac608D9F8992190F5"
  // );
  // const dai = await ethers.getContractAt(
  //   "MockERC20",
  //   "0x544380B5EE3d1a8485671537a553F61f3c7190f1"
  // );
  const maha = await ethers.getContractAt(
    "MockERC20",
    "0x7aF163582b3ebAAbB7bce03aaDa8C1d76d655a5c"
  );

  await maha.mint(deployer.address, amount.mul(3));
  // await dai.mint(deployer.address, amount.mul(3));
  // await solid.mint(deployer.address, amount.mul(3));

  // await solid.approve(bribe.address, amount.mul(3));
  // await maha.approve(bribe.address, amount.mul(3));
  // await dai.approve(bribe.address, amount.mul(3));

  // await solid.approve(gauge.address, amount.mul(3));
  await maha.approve(gauge.address, amount.mul(3));
  // await dai.approve(gauge.address, amount.mul(3));

  // await bribe.notifyRewardAmount(solid.address, amount);
  // // await bribe.notifyRewardAmount(maha.address, amount);
  // await bribe.notifyRewardAmount(dai.address, amount);

  // await gauge.notifyRewardAmount(solid.address, amount);
  await gauge.notifyRewardAmount(maha.address, amount);
  // await gauge.notifyRewardAmount(dai.address, amount);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
