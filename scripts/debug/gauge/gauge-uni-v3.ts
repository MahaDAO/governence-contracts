import {
  impersonateAccount,
  setBalance,
} from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../../utils";

async function main() {
  const uniPositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const tokenA = "ARTH";
  const tokenB = "WETH";
  const fee = 10000;
  const registryAddr = await getOutputAddress("Registry");
  const poolAddr = await getOutputAddress("ARTHWETH-UniV3-Pool");
  const feeSplitter = "0x9032f1bd0cc645fde1b41941990da85f265a7623";

  const whale = "0x77cd66d59ac48a0E7CE54fF16D9235a5fffF335E";
  const gnosisAddr = "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC";

  await impersonateAccount(gnosisAddr);
  await impersonateAccount(whale);

  setBalance(gnosisAddr, "0x56BC75E2D63100000");

  const gnosis = await ethers.getSigner(gnosisAddr);
  const deployer = await ethers.getSigner(whale);
  const nftId = "411235";

  // const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const tokens = await Promise.all([
    ethers.getContractAt("IERC20", await getOutputAddress(tokenA)),
    ethers.getContractAt("IERC20", await getOutputAddress(tokenB)),
  ]);

  const registry = await ethers.getContractAt("Registry", registryAddr);

  const uniswapNft = await ethers.getContractAt(
    "INonfungiblePositionManager",
    await getOutputAddress("UniswapNFTManager")
  );

  // update gauge on voter
  const timelock = await getOutputAddress("MAHATimelockController-14d");

  const BaseGaugeV3UniV3 = await ethers.getContractFactory("GaugeUniswapV3");
  const initData = BaseGaugeV3UniV3.interface.encodeFunctionData("initialize", [
    registryAddr,
    tokens[0].address, // address token0,
    tokens[1].address, // address token1,
    fee, // uint24 fee,
    uniPositionManager, // INonfungiblePositionManager _nonfungiblePositionManager,
    feeSplitter,
  ]);

  const voter = await (await ethers.getContractFactory(`BaseV2Voter`)).deploy();

  console.log("set voter");
  await voter.connect(gnosis).initialize(registryAddr, gnosisAddr);
  await registry.connect(gnosis).setVoter(voter.address);

  const implementation = await deployOrLoadAndVerify(
    `GaugeUniswapV3-Impl`,
    "GaugeUniswapV3",
    []
  );

  const proxy = await deployOrLoadAndVerify(
    `${tokenA}${tokenB}-UniV3GaugeProxy`,
    "TransparentUpgradeableProxy",
    [implementation.address, timelock, initData]
  );

  const gauge = await ethers.getContractAt("GaugeUniswapV3", proxy.address);

  await voter.connect(gnosis).toggleWhitelist(proxy.address);
  await voter.connect(gnosis).toggleWhitelist(poolAddr);
  await voter
    .connect(gnosis)
    .toggleWhitelist(await getOutputAddress("ARTHWETH-Bribe"));

  // update
  await voter
    .connect(gnosis)
    .registerGaugeBribe(
      await getOutputAddress("ARTHWETH-UniV3-Pool"),
      await getOutputAddress("ARTHWETH-Bribe"),
      proxy.address
    );

  console.log(
    "userRewardPerTokenPaid",
    await gauge.userRewardPerTokenPaid(nftId)
  );
  console.log("earned", await gauge.earned(nftId));

  // stake
  console.log("stake");
  await uniswapNft
    .connect(deployer)
    ["safeTransferFrom(address,address,uint256)"](
      deployer.address,
      proxy.address,
      nftId
    );

  await network.provider.send("evm_setNextBlockTimestamp", [
    Math.floor(new Date("2023-01-24T05:56:14.524Z").getTime() / 1000),
  ]);

  // voter
  console.log("vote for pool");
  await voter.connect(deployer).vote([poolAddr], [10000]);

  // distribute rewards
  console.log("distribute rewards");
  await voter["distribute(address)"](gauge.address);

  console.log(
    "userRewardPerTokenPaid",
    await gauge.userRewardPerTokenPaid(nftId)
  );
  console.log("earned", await gauge.earned(nftId));
  await gauge.updateRewardFor(nftId);

  await network.provider.send("evm_setNextBlockTimestamp", [
    Math.floor(new Date("2023-02-24T05:56:14.524Z").getTime() / 1000),
  ]);

  console.log(
    "userRewardPerTokenPaid",
    await gauge.userRewardPerTokenPaid(nftId)
  );
  console.log("earned", await gauge.earned(nftId));

  await network.provider.send("evm_setNextBlockTimestamp", [
    Math.floor(new Date("2023-09-20T00:00:00.000Z").getTime() / 1000),
  ]);

  console.log(
    "userRewardPerTokenPaid",
    await gauge.userRewardPerTokenPaid(nftId)
  );
  console.log("earned", await gauge.earned(nftId));

  // withdraw
  console.log("withdraw");
  console.log("me bal t0", await tokens[0].balanceOf(deployer.address));
  console.log("me bal t1", await tokens[1].balanceOf(deployer.address));
  console.log("te bal t0", await tokens[0].balanceOf(feeSplitter));
  console.log("te bal t1", await tokens[1].balanceOf(feeSplitter));
  await gauge.connect(deployer).withdraw(nftId);

  console.log("me bal t0", await tokens[0].balanceOf(deployer.address));
  console.log("me bal t1", await tokens[1].balanceOf(deployer.address));
  console.log("te bal t0", await tokens[0].balanceOf(feeSplitter));
  console.log("te bal t1", await tokens[1].balanceOf(feeSplitter));

  console.log(
    "userRewardPerTokenPaid",
    await gauge.userRewardPerTokenPaid(nftId)
  );
  console.log("earned", await gauge.earned(nftId));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
