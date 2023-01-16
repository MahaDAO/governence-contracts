import { ethers, network } from "hardhat";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const gnosisSafe = "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC";
  const address = "0xeccE08c2636820a81FC0c805dBDC7D846636bbc4";

  await helpers.impersonateAccount(address);
  await helpers.impersonateAccount(gnosisSafe);

  const deployer = await ethers.getSigner(address);
  const gnosis = await ethers.getSigner(gnosisSafe);

  helpers.setBalance(gnosisSafe, "0x56BC75E2D63100000");

  console.log(`deployer address is ${deployer.address}.`);

  const timelock = await ethers.getContractAt(
    "MAHATimelockController",
    "0x43c958AFFe41D44F0a02aE177b591E93c86AdbEa"
  );
  const maha = await ethers.getContractAt(
    "IERC20",
    "0x745407c86df8db893011912d3ab28e68b62e49b0"
  );

  const vesting = await ethers.getContractAt(
    "Vesting",
    "0xFdf0d51ddD34102472D7130c3d4831BC77386e78"
  );

  console.log(
    "maha safe before",
    (await maha.balanceOf(gnosis.address)).toString()
  );

  // send maha to the vesting contract
  await maha
    .connect(gnosis)
    .transfer(vesting.address, "5347371545021776766262061");

  console.log("maha safe", (await maha.balanceOf(gnosis.address)).toString());
  console.log("releasable", (await vesting.releasableAmount()).toString());

  // ensure that the timelock can refund tokens back.

  await timelock
    .connect(gnosis)
    .grantRole(await timelock.PROPOSER_ROLE(), gnosis.address);
  await timelock
    .connect(gnosis)
    .grantRole(await timelock.EXECUTOR_ROLE(), gnosis.address);

  const execute: [string, number, string, string, string] = [
    vesting.address, // address target,
    0, // uint256 value
    "0xf2fde38b0000000000000000000000006357EDbfE5aDA570005ceB8FAd3139eF5A8863CC", // bytes calldata data, transferOwnership
    "0x0000000000000000000000000000000000000000000000000000000000000000", // bytes32 predecessor,
    "0x724e78da000000000000000000000000cb056c17ce063f20a8d0650f30550b20", // bytes32 salt,
  ];

  const hash = await timelock.hashOperation(
    execute[0],
    execute[1],
    execute[2],
    execute[3],
    execute[4]
  );
  console.log(hash);

  const tx = await timelock
    .connect(gnosis)
    .schedule(
      execute[0],
      execute[1],
      execute[2],
      execute[3],
      execute[4],
      await timelock.getMinDelay()
    );

  console.log(`tx ${tx.hash}`);

  console.log("is pending?", await timelock.isOperationPending(hash));
  console.log("is done?", await timelock.isOperationDone(hash));
  console.log("is ready?", await timelock.isOperationReady(hash));

  // wait for 15 days
  // suppose the current block has a timestamp of 01:00 PM
  await network.provider.send("evm_setNextBlockTimestamp", [
    Math.floor(Date.now() / 1000) +
      (await timelock.getMinDelay()).toNumber() * 2,
  ]);
  await network.provider.send("evm_mine"); // this one will have 02:00 PM as its timestamp

  // execute the tx
  const tx2 = await timelock
    .connect(gnosis)
    .execute(execute[0], execute[1], execute[2], execute[3], execute[4]);
  console.log(`tx2 ${tx2.hash}`);

  console.log("is pending?", await timelock.isOperationPending(hash));
  console.log("is done?", await timelock.isOperationDone(hash));
  console.log("is ready?", await timelock.isOperationReady(hash));

  // now check whatever we want here
  console.log(
    "maha safe before",
    (await maha.balanceOf(gnosis.address)).toString()
  );
  await vesting.connect(gnosis).refund(maha.address);
  console.log(
    "maha safe after",
    (await maha.balanceOf(gnosis.address)).toString()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
