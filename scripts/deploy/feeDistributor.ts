import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`Deploying migrator to ${network.name}`);

  const tokenSymbol = "SCLP";

  const [deployer] = await ethers.getSigners();
  console.log(`deployer address is ${deployer.address}`);

  const pendingFeeDistributor = await getOutputAddress(
    `${tokenSymbol}PendingFeeDistributor`
  );

  // Get all the deployed smart contracts.
  const token = await ethers.getContractAt(
    "MockERC20",
    await getOutputAddress(tokenSymbol)
  );

  const lock = await deployOrLoadAndVerify(
    `${tokenSymbol}FeeDistributor`,
    "FeeDistributor",
    [
      await getOutputAddress("MAHAXLocker"),
      token.address,
      pendingFeeDistributor,
      await getOutputAddress("MAHATimelockController-14d"),
    ]
  );

  if (network.name === "goerli") {
    console.log("minting tokens to the FeeDistributor contract");
    const tx1 = await token.mint(lock.address, BigNumber.from(10).pow(24));
    await tx1.wait();

    console.log("minting tokens to the PendingFeeDistributor contract");
    const tx2 = await token.mint(
      pendingFeeDistributor,
      BigNumber.from(10).pow(18).mul(10000)
    );
    await tx2.wait();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
