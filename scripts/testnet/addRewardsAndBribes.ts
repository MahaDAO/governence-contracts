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

  // const gauge = await ethers.getContractAt(
  //   "BaseGaugeV2",
  //   "0x500e99A6FE5D37a83762A3Febd1447b52C62ee5E"
  // );
  const gauge = await ethers.getContractAt(
    "BaseGaugeV2UniV3",
    "0x26bb6Eb904C5ACFC89C82E56C3bAfCf93f4A63B7"
  );
  const amount = BigNumber.from(10).pow(18).mul(1e8);
  const amounte6 = BigNumber.from(10).pow(6).mul(1e8);

  const solid = await ethers.getContractAt(
    "MockERC20",
    "0xD09cb6c1aAb18239B7C0880BFcfaAbca461cBac3"
  );
  const dai = await ethers.getContractAt(
    "MockERC20",
    "0xbAE4E07480f16d82Bc13850C36631C21861E245b"
  );
  const maha = await ethers.getContractAt(
    "MockERC20",
    "0xAaA6a7A5d7eC7C7691576D557E1D2CDaBeca6C4A"
  );
  const usdc = await ethers.getContractAt(
    "MockERC20",
    "0x3e922459b8D5956E3c886aCA472688F811821F6b"
  );

  await maha.mint(deployer.address, amount.mul(3));
  await dai.mint(deployer.address, amount.mul(3));
  await solid.mint(deployer.address, amount.mul(3));
  await usdc.mint(deployer.address, amounte6.mul(3));

  // await solid.approve(bribe.address, amount.mul(3));
  // await maha.approve(bribe.address, amount.mul(3));
  // await dai.approve(bribe.address, amount.mul(3));

  let tx = await solid.approve(gauge.address, amount.mul(3));
  await tx.wait();
  tx = await maha.approve(gauge.address, amount.mul(3));
  await tx.wait();
  tx = await dai.approve(gauge.address, amount.mul(3));
  await tx.wait();
  tx = await usdc.approve(gauge.address, amounte6.mul(3));
  await tx.wait();

  // await bribe.notifyRewardAmount(solid.address, amount);
  // // await bribe.notifyRewardAmount(maha.address, amount);
  // await bribe.notifyRewardAmount(dai.address, amount);

  await gauge.notifyRewardAmount(maha.address, amount);
  // await gauge.notifyRewardAmount(solid.address, amount);
  // await gauge.notifyRewardAmount(dai.address, amount);
  // await gauge.notifyRewardAmount(usdc.address, amounte6);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
