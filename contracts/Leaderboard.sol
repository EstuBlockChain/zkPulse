// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Leaderboard is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct PlayerScore {
        address player;
        uint256 score;
        uint256 reliability; // ABI Compatibility
        uint256 timestamp;
    }

    // Only keep best scores on-chain to save gas
    mapping(address => uint256) public bestScores;
    
    // Track leaderboard entries
    PlayerScore[] public scores;
    mapping(address => uint256) public playerToIndex; // 1-indexed
    uint256 public totalGames;

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

    function submitScore(uint256 _score, bytes calldata _signature) external {
        // 1. Verify Signature
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, _score));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        
        address recoveredSigner = ethSignedHash.recover(_signature);
        require(recoveredSigner == oracle, "Invalid Oracle Signature");

        totalGames++;

        // 2. Optimized Storage Logic (One entry per player)
        if (_score > bestScores[msg.sender]) {
            bestScores[msg.sender] = _score;
            
            uint256 index = playerToIndex[msg.sender];
            if (index == 0) {
                // New player
                scores.push(PlayerScore({
                    player: msg.sender,
                    score: _score,
                    reliability: 0,
                    timestamp: block.timestamp
                }));
                playerToIndex[msg.sender] = scores.length;
            } else {
                // Existing player, update record
                PlayerScore storage record = scores[index - 1];
                record.score = _score;
                record.timestamp = block.timestamp;
            }
            
            emit NewHighScore(msg.sender, _score);
        }
        
        emit NewScore(msg.sender, _score);
    }

    function getLeaderboard() external view returns (PlayerScore[] memory) {
        return scores;
    }

    function getTotalGames() external view returns (uint256) {
        return totalGames;
    }
}
