// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Leaderboard is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Only keep best scores on-chain to save gas
    mapping(address => uint256) public bestScores;
    
    // Address of the trusted Oracle (Server)
    address public oracle;

    // Event for general game history (Cheap, ~2-3k gas)
    event NewScore(address indexed player, uint256 score); 
    
    // Event specific to breaking a record
    event NewHighScore(address indexed player, uint256 score);

    constructor(address _oracle) Ownable(msg.sender) {
        oracle = _oracle;
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    /**
     * @dev Submit a new score. Only accepts scores signed by the Oracle.
     * @param _score The score achieved.
     * @param _signature The cryptographic signature from the Oracle.
     */
    function submitScore(uint256 _score, bytes calldata _signature) external {
        // 1. Verify Signature
        // Hash(msg.sender, _score)
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, _score));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        
        address recoveredSigner = ethSignedHash.recover(_signature);
        require(recoveredSigner == oracle, "Invalid Oracle Signature");

        // 2. Optimized Storage Logic (Best Score Only)
        if (_score > bestScores[msg.sender]) {
            bestScores[msg.sender] = _score;
            emit NewHighScore(msg.sender, _score);
        }
        
        // Always emit playing event (for history reconstruction via TheGraph/Indexers)
        emit NewScore(msg.sender, _score);
    }
}
