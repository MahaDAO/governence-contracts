import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`Deploying on ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const e6 = BigNumber.from(10).pow(6);
  const percentages = [e6.mul(4).div(5), e6.div(5)];

  await deployOrLoadAndVerify(`MAHASplitKeeper`, "MAHASplitKeeper", [
    [
      "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC",
      "0x4723babf3e761f41e298cb034fd387d2e27ac9d7",
    ],
    percentages, // uint32[] memory _percentAllocations,
    await getOutputAddress("MAHA"), // IERC20 _maha,
    "0xFF3731BD6F44E49831eaCc30388506e6bcE4F49e", // ICommunityFund _fund
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
