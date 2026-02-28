// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IdentityRegistry
 * @dev Store & retrieve student identity verification hashes.
 */
contract IdentityRegistry {
    
    // Address of the verified admin (e.g. backend server address) allowed to write to the ledger
    address public admin;

    struct Verification {
        string studentId;
        string faceMatchHash;  // SHA-256 hash or IPFS CID of the face match data
        bool isVerified;       // True if AI passed and Admin approved
        uint256 timestamp;
    }

    // Mapping from Student ID to their Verification Data
    mapping(string => Verification) private verifications;

    // Event emitted when a new verification is stored on-chain
    event VerificationLogged(string indexed studentId, string faceMatchHash, bool isVerified, uint256 timestamp);

    // Modifier to restrict access to only the authorized admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized: Admin only");
        _;
    }

    constructor() {
        // The wallet deploying this contract becomes the Admin
        admin = msg.sender;
    }

    /**
     * @dev Stores the final verification hash for a student.
     * @param _studentId Unique identifier for the student.
     * @param _faceMatchHash Cryptographic hash of the AI payload (Face Score & Liveness output).
     * @param _isVerified Final boolean verdict (True = approved, False = rejected).
     */
    function storeVerification(string memory _studentId, string memory _faceMatchHash, bool _isVerified) public onlyAdmin {
        
        // Ensure student hasn't already been verified (optional, remove if overwrites are allowed)
        // require(bytes(verifications[_studentId].studentId).length == 0, "Student already verified");

        verifications[_studentId] = Verification({
            studentId: _studentId,
            faceMatchHash: _faceMatchHash,
            isVerified: _isVerified,
            timestamp: block.timestamp
        });

        emit VerificationLogged(_studentId, _faceMatchHash, _isVerified, block.timestamp);
    }

    /**
     * @dev Retrieves the stored verification hash to cross-check against the local database.
     * @param _studentId Unique identifier for the student.
     * @return studentId The student's ID string
     * @return faceMatchHash The immutable hash stored on Polygon
     * @return isVerified The approval status
     * @return timestamp The unix timestamp of the storage
     */
    function getVerification(string memory _studentId) public view returns (string memory, string memory, bool, uint256) {
        Verification memory v = verifications[_studentId];
        // Revert if record doesn't exist to prevent returning empty structs
        require(bytes(v.studentId).length > 0, "No verification found for this Student ID");
        
        return (v.studentId, v.faceMatchHash, v.isVerified, v.timestamp);
    }
}
