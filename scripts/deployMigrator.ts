import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "./utils";

async function main() {
  console.log(`Deploying migrator to ${network.name}`);

  const _merkleRoot =
    "0xc3c86b1fc1994656a4b1e8cd426aab572faac034a85526be797fe55f4391b08b";

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  // Get all the deployed smart contracts.
  const maha = await ethers.getContractAt(
    "MockERC20",
    await getOutputAddress("MAHA")
  );
  const sclp = await ethers.getContractAt(
    "MockERC20",
    await getOutputAddress("SCLP")
  );
  const locker = await ethers.getContractAt(
    "MAHAXLocker",
    await getOutputAddress("MAHAXLocker")
  );

  const lock = await deployOrLoadAndVerify("LockMigrator", "LockMigrator", [
    _merkleRoot,
    maha.address,
    sclp.address,
    locker.address,
  ]);

  if (network.name === "goerli") {
    console.log("minting scallop and maha to the migrator contract");

    const tx1 = await maha.mint(lock.address, BigNumber.from(10).pow(24));
    await tx1.wait();

    const tx2 = await sclp.mint(lock.address, BigNumber.from(10).pow(24));
    await tx2.wait();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
