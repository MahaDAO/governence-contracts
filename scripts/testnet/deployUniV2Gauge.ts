import hre, { ethers, network } from "hardhat";
import { getOutputAddress, saveABI } from "../utils";

import verifyContract from "../verifyContract";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const tokenA = "WETH";
  const tokenB = "MAHA";
  const pool = "Uniswap";

  const poolAddress = "0x95394092a343f2f9ddc5f68e332ed3ef80a6cbb5";

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  // Get all smart contract factories
  const gaugeCF = await ethers.getContractFactory("GaugeLP");
  const bribesCF = await ethers.getContractFactory("BaseV2Bribes");

  // Get all the deployed smart contracts.
  const voter = await ethers.getContractAt(
    "BaseV2Voter",
    await getOutputAddress("BaseV2Voter")
  );
  const registry = await ethers.getContractAt(
    "Registry",
    await getOutputAddress("Registry")
  );

  const gaugeContractInstance = await gaugeCF.deploy({ gasPrice });
  await gaugeContractInstance.deployed();
  await gaugeContractInstance.initialize(registry.address, poolAddress, {
    gasPrice,
  });

  const bribesInstance = await bribesCF.deploy(registry.address, { gasPrice });
  await bribesInstance.deployed();

  console.log("univ3GaugeContractInstance", gaugeContractInstance.address);
  console.log("bribesInstance", bribesInstance.address);

  !(await voter.whitelist(gaugeContractInstance.address)) &&
    (await (async () => {
      const tx = await voter.toggleWhitelist(gaugeContractInstance.address, {
        gasPrice,
      });
      console.log("tx gauge whitelist", tx.hash);
      await tx.wait();
    })());

  !(await voter.whitelist(poolAddress)) &&
    (await (async () => {
      const tx = await voter.toggleWhitelist(poolAddress, { gasPrice });
      console.log("tx pool whitelist", tx.hash);
      await tx.wait();
    })());

  !(await voter.whitelist(bribesInstance.address)) &&
    (await (async () => {
      const tx = await voter.toggleWhitelist(bribesInstance.address, {
        gasPrice,
      });
      console.log("tx bribes whitelist", tx.hash);
      await tx.wait();
    })());

  const tx4 = await voter.registerGaugeBribe(
    poolAddress,
    bribesInstance.address,
    gaugeContractInstance.address,
    { gasPrice }
  );
  console.log("tx registerGauge", tx4.hash);
  await tx4.wait();

  await saveABI(
    `${tokenA}${tokenB}-${pool}-Gauge`,
    "GaugeLP",
    gaugeContractInstance.address
  );
  await saveABI(
    `${tokenA}${tokenB}-${pool}-Bribe`,
    "BaseV2Bribes",
    bribesInstance.address
  );
  await saveABI(`${tokenA}${tokenB}-${pool}-Pool`, "IERC20", poolAddress);

  await verifyContract(hre, gaugeContractInstance.address, []);
  await verifyContract(hre, bribesInstance.address, [registry.address]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
