import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { getOutputAddress } from "../utils";

// const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  const now = 1661385600; // Math.floor(Date.now() / 1000);

  // const address = "0xeccE08c2636820a81FC0c805dBDC7D846636bbc4";
  // await helpers.impersonateAccount(address);
  // const impersonatedSigner = await ethers.getSigner(address);

  console.log(`deployer address is ${deployer.address}.`);

  const mahaxCI = await ethers.getContractAt(
    "MAHAXLocker",
    await getOutputAddress("MAHAXLocker", "ethereum")
  );
  const sclpCI = await ethers.getContractAt(
    "IERC20",
    getOutputAddress("SCLP", "ethereum")
  );
  const mahaCI = await ethers.getContractAt(
    "IERC20",
    getOutputAddress("MAHA", "ethereum")
  );

  console.log(
    mahaxCI.address,
    now,
    mahaCI.address,
    deployer.address,
    deployer.address
  );

  const factory = await ethers.getContractFactory("MultiFeeDistributor");
  const inst = await factory.connect(deployer).deploy();
  // .deploy(mahaxCI.address, now, mahaCI.address);

  // const inst = await ethers.getContractAt(
  //   "MultiFeeDistributor",
  //   "0x2d2592539843e2C9bB6246B066a98993C3EdA630"
  // );

  // const inst = await ethers.getContractAt(
  //   "FeeDistributor",
  //   "0x08777b62740f121B88F7CF7fCA728101BEa14162"
  // );

  // const e18 = BigNumber.from(10).pow(18);
  // await mahaCI.connect(deployer).transfer(contract.address, e18.mul(10));

  console.log("distributor at", inst.address);

  // // console.log("token", await inst.token());
  // // console.log("startTime", (await inst.callStatic.startTime()).toString());
  // console.log("timeCursor", (await inst.timeCursor()).toString());

  console.log(
    "maha me",
    await (await mahaCI.balanceOf(deployer.address)).toString()
  );
  console.log(
    "sclp me",
    await (await sclpCI.balanceOf(deployer.address)).toString()
  );

  // suppose the current block has a timestamp of 01:00 PM
  // await network.provider.send("evm_setNextBlockTimestamp", [
  //   Math.floor(new Date("2022-09-01T00:00:00.000Z").getTime() / 1000),
  // ]);
  // console.log("timeCursor", (await inst.timeCursor()).toString());
  await network.provider.send("evm_mine"); // this one will have 02:00 PM as its timestamp

  console.log(
    "claim",
    await inst.claimMany(
      [1, 1],
      [
        "0x9B5cf0beE733d3625E5fb693c34F8Bb86fBEf2B6",
        "0x08777b62740f121B88F7CF7fCA728101BEa14162",
      ]
    )
  );

  console.log(
    "maha me",
    await (await mahaCI.balanceOf(deployer.address)).toString()
  );
  console.log(
    "sclp me",
    await (await sclpCI.balanceOf(deployer.address)).toString()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
