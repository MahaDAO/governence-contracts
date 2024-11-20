import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { keccak256 } from "ethers/lib/utils";

type UserDetails = {
  user: string;
  nftId: number;
  mahaLocked: number;
  startDate: string;
  endDate: string;
};

const parseCSV = async (filePath: string): Promise<UserDetails[]> => {
  return new Promise((resolve, reject) => {
    const result: UserDetails[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        try {
          const userDetail: UserDetails = {
            user: data.user,
            nftId: parseInt(data.nftId, 10),
            mahaLocked: parseFloat(data.mahaLocked),
            startDate: data.startDate,
            endDate: data.endDate,
          };

          if (
            !userDetail.user ||
            isNaN(userDetail.nftId) ||
            isNaN(userDetail.mahaLocked) ||
            !userDetail.startDate ||
            !userDetail.endDate
          ) {
            throw new Error(`Invalid data in ${JSON.stringify(data)}`);
          }

          result.push(userDetail);
        } catch (err) {
          console.error("Error processing row:", data, err);
        }
      })
      .on("end", () => resolve(result))
      .on("error", (error) => reject(error));
  });
};

const hashLeafNode = (
  user: string,
  nftId: number,
  mahaLocked: number,
  startDate: string,
  endDate: string
): Buffer => {
  return Buffer.from(
    keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256", "string", "string"],
        [user, nftId, mahaLocked, startDate, endDate]
      )
    ).slice(2),
    "hex"
  );
};

async function main() {
  const csvFilePath = path.resolve(__dirname, "./userDetails.csv"); // Absolute path to the input CSV file
  const outputFilePath = path.resolve(__dirname, "./merkleTreeOutput.json"); // Absolute path to the output JSON file

  if (!csvFilePath) {
    throw new Error("Please provide the path to the CSV file as an argument.");
  }
  // Parse CSV file to get user details
  const userDetails: UserDetails[] = await parseCSV(csvFilePath);

  // Create leaf nodes by hashing user details
  const leafNodes = userDetails.map((detail) =>
    hashLeafNode(
      detail.user,
      detail.nftId,
      detail.mahaLocked,
      detail.startDate,
      detail.endDate
    )
  );

  // Create a Merkle tree using the hashed leaf nodes
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

  // Get the Merkle root
  const merkleRoot = merkleTree.getHexRoot();

  console.log("Merkle Tree Root:", merkleRoot);

  const output = {
    root: merkleRoot,
    leaves: userDetails.map((data, index) => ({
      data,
      proof: merkleTree.getHexProof(leafNodes[index]),
    })),
  };

  fs.writeFileSync(outputFilePath, JSON.stringify(output, null, 2));
  console.log("Merkle tree written into:", outputFilePath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
