const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IdentityVerification Smart Contract", function () {
  let identityVerification;
  let admin;
  let randomUser;

  // This runs before every single test to give us a fresh, clean contract
  beforeEach(async function () {
    // Get fake "accounts" from Hardhat's local testing blockchain
    [admin, randomUser] = await ethers.getSigners();

    // Deploy the contract
    const IdentityVerification = await ethers.getContractFactory("IdentityVerification");
    identityVerification = await IdentityVerification.deploy();
  });

  it("Should set the right admin when deployed", async function () {
    // The admin should be the account that deployed it
    expect(await identityVerification.admin()).to.equal(admin.address);
  });

  it("Should successfully store and retrieve a verification hash", async function () {
    const studentId = "22CIS0329"; 
    const documentHash = "0x8ex7dmzvpbo946fewlf7ij6yfuxba2br"; // Simulated SHA-256 hash

    // Store the hash using the admin account
    await identityVerification.storeVerificationHash(studentId, documentHash);

    // Retrieve the record
    const record = await identityVerification.getVerificationRecord(studentId);

    // Check if the retrieved data matches what we stored
    expect(record[0]).to.equal(studentId);      // studentId
    expect(record[1]).to.equal(documentHash);   // documentHash
    expect(record[3]).to.equal(true);           // isValid
  });

  it("Should prevent non-admins from storing hashes", async function () {
    const studentId = "22CIS0330";
    const documentHash = "0xfakehash123456789";

    // Try to connect as 'randomUser' instead of 'admin' and store a hash
    await expect(
      identityVerification.connect(randomUser).storeVerificationHash(studentId, documentHash)
    ).to.be.revertedWith("Only the admin can perform this action");
  });
});