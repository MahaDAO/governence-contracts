import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const uniPositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const tokenA = "ARTH";
  const tokenB = "MAHA";
  const fee = 10000;
  const registry = await getOutputAddress("Registry");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  // Get all the deployed smart contracts.
  const tokens = await Promise.all([
    getOutputAddress(tokenA),
    getOutputAddress(tokenB),
  ]);

  const proxyAdmin = "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC";

  const BaseGaugeV3UniV3 = await ethers.getContractFactory("BaseGaugeV3UniV3");
  const data = BaseGaugeV3UniV3.interface.encodeFunctionData("initialize", [
    registry,
    tokens[0], // address token0,
    tokens[1], // address token1,
    fee, // uint24 fee,
    getOutputAddress(tokenB), // address _rewardsToken,
    uniPositionManager, // INonfungiblePositionManager _nonfungiblePositionManager
  ]);

  const univ3GaugeContractImpl = await deployOrLoadAndVerify(
    `${tokenA}${tokenB}-UniV3GaugeImpl`,
    "BaseGaugeV3UniV3",
    []
  );

  const univ3GaugeContractProxy = await deployOrLoadAndVerify(
    `${tokenA}${tokenB}-UniV3GaugeProxy`,
    "TransparentUpgradeableProxy",
    [univ3GaugeContractImpl.address, proxyAdmin, data]
  );

  const bribesInstance = await deployOrLoadAndVerify(
    `${tokenA}${tokenB}-UniV3Bribe`,
    "BaseV2Bribes",
    [registry]
  );

  console.log("univ3GaugeContractImpl", univ3GaugeContractImpl.address);
  console.log("univ3GaugeContractProxy", univ3GaugeContractProxy.address);
  console.log("bribesInstance", bribesInstance.address);

  // await saveABI(
  //   `${tokenA}${tokenB}-UniV3-Pool`,
  //   "IUniswapV3Pool",
  //   await univ3GaugeContractProxy.pool(),
  //   true
  // );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
