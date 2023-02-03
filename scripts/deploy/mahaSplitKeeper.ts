import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`Deploying on ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const e6 = BigNumber.from(10).pow(6);
  const percentages = [
    e6.mul(517).div(10000),
    e6.mul(3448).div(10000),
    e6.mul(862).div(10000),
    e6.mul(862).div(10000),
    e6.mul(3448).div(10000),
    e6.mul(863).div(10000),
  ];

  await deployOrLoadAndVerify(`MAHASplitKeeper`, "MAHASplitKeeper", [
    [
      "0x516bd18Ba17f70f08C8C91fE7F9Ee2105DC275d2",
      "0x9a7e3373b0E509379a24BA4983d72c51Bc416907",
      "0xBd86A195c90ceC4606dBC378Ea0aa338f674a704",
      "0x2E8978Ae41ec867a0eB5dAf38a4E8b62858DbFCb",
      "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC",
      "0xd6Cbab1809f37e88048A7d1527C318e58B01FdC6",
    ],
    percentages, // uint32[] memory _percentAllocations,
    await getOutputAddress("MAHA"), // IERC20 _maha,
    "0xfdf0d51ddd34102472d7130c3d4831bc77386e78", // ICommunityFund _fund
    "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC", // ownership
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
