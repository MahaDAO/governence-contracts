import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`deploying to ${network.name}`);
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  // Get all the deployed smart contracts.
  const locker = await getOutputAddress("MAHAXLocker", "ethereum");
  const maha = await ethers.getContractAt(
    "IERC20",
    await getOutputAddress("MAHA", "ethereum")
  );

  const referral = await deployOrLoadAndVerify(
    "MAHAReferralV1",
    "MAHAReferralV1",
    [
      locker, // INFTLocker _locker,
      maha.address, // IERC20 _maha,
      86400 * 30, // uint256 _minLockDuration
    ]
  );

  console.log(
    await maha.balanceOf(deployer.address),
    deployer.address,
    maha.address
  );

  // await maha
  //   .connect(deployer)
  //   .transfer(referral.address, "100000000000000000000");

  await maha.approve(referral.address, "10000000000000000000000");

  await referral.createLockWithReferral(
    "100000000000000000000", // uint256 _value,
    86400 * 365 * 4, // uint256 _lockDuration,
    true, // bool _stakeNFT,
    "0xeccE08c2636820a81FC0c805dBDC7D846636bbc4" // address referral
  );
  console.log(referral.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
