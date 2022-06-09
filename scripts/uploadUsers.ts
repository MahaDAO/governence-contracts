import { ethers } from "hardhat";

import { DEPLOYED_NFT_VOTING_ESCROW } from "./config";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(7).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  const mahax = await ethers.getContractAt("MAHAX", DEPLOYED_NFT_VOTING_ESCROW);

  const uniqueUsersSnapshotData = require("../output/userLockSnapshot.json");
  const uniqueUsers: string[] = Object.keys(uniqueUsersSnapshotData);
  console.log(`There are total ${uniqueUsers.length} users.`);

  const users: string[] = [];
  const values: string[] = [];
  const durations: string[] = [];
  for (const user of uniqueUsers) {
    const amount = uniqueUsersSnapshotData[user].amount;
    if (!Number(amount)) {
      console.log(`User ${user} skipped!`);
      continue;
    }

    users.push(user);
    values.push(amount);

    // For adding a week or so to user whose lock is expired or about to expire because of rounding
    // while uploading snapshot.
    const bufferForWeekRoundingInSec = 15 * 24 * 60 * 60 * 1000;

    // Fetch the current unlockTimestamp of user.
    const unlockTime = Number(uniqueUsersSnapshotData[user].endTime);
    // Figure out the duration from the unlock timestamp.
    if (
      Math.floor((Date.now() + bufferForWeekRoundingInSec) / 1000) >= unlockTime
    ) {
      durations.push(Math.floor(bufferForWeekRoundingInSec / 1000).toString());
    } else {
      durations.push((unlockTime - Math.floor(Date.now() / 1000)).toString());
    }
  }

  const batchSize = 20;
  for (let i = 0; i < users.length; ) {
    const start = i;
    const end = i + batchSize;

    console.log(`Uploading from index ${start} to ${end}`);

    const batchUsers = users.slice(start, end);
    const batchValues = values.slice(start, end);
    const batchDurations = durations.slice(start, end);

    const tx = await mahax.uploadUsers(
      batchUsers,
      batchValues,
      batchDurations,
      {
        gasPrice,
      }
    );
    await tx.wait(); // Because tx might revert for a batch, hence we have to reupload that batch later on.

    i = i + batchSize;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
