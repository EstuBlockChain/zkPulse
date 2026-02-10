// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title Leaderboard
 * @dev Stores player scores and reliability, keeping a list of top scores.
 */
contract Leaderboard {
    struct PlayerScore {
        address player;
        uint256 score;
        uint256 reliability; // New field: 0-100 representing percentage
        uint256 timestamp;
    }

    // Array to store all scores
    PlayerScore[] public scores;

    // Mapping to check if a user already played (optional, or to update their best score)
    mapping(address => uint256) public bestScores;

    event NewScore(address indexed player, uint256 score, uint256 reliability);

    /**
     * @dev Submit a new score with reliability.
     * @param _score The score achieved by the player.
     * @param _reliability The reliability percentage (0-100).
     */
    function submitScore(uint256 _score, uint256 _reliability) public {
        require(_score > 0, "Score must be positive");

        // Update personal best
        if (_score > bestScores[msg.sender]) {
            bestScores[msg.sender] = _score;
        }

        // Add to history
        scores.push(PlayerScore({
            player: msg.sender,
            score: _score,
            reliability: _reliability,
            timestamp: block.timestamp
        }));

        emit NewScore(msg.sender, _score, _reliability);
    }

    /**
     * @dev Retrieve all scores. 
     */
    function getLeaderboard() public view returns (PlayerScore[] memory) {
        return scores;
    }
    
    /**
     * @dev Get total number of games played
     */
    function getTotalGames() public view returns (uint256) {
        return scores.length;
    }
}
