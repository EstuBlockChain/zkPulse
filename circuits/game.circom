pragma circom 2.0.0;

include "../FrontEnd/node_modules/circomlib/circuits/poseidon.circom";
include "../FrontEnd/node_modules/circomlib/circuits/comparators.circom";
include "../FrontEnd/node_modules/circomlib/circuits/bitify.circom";

// Constants for probability thresholds (scaled to 0-255)
// Green: < 60% = 153
// Yellow: < 90% = 230
// Red: >= 230

template Game(MAX_STEPS) {
    signal input seed;          
    signal input clicks[MAX_STEPS]; // Private: 1 = Hit, 0 = Miss
    signal output score;

    signal internalScore[MAX_STEPS + 1];
    internalScore[0] <== 0;

    component hash[MAX_STEPS];
    component n2b[MAX_STEPS];
    component ltGreen[MAX_STEPS];
    component ltYellow[MAX_STEPS];
    
    signal randByte[MAX_STEPS];
    signal isGreen[MAX_STEPS];
    signal isYellow[MAX_STEPS];
    signal isRed[MAX_STEPS];
    signal points[MAX_STEPS];
    
    // Logic Loop
    for (var i = 0; i < MAX_STEPS; i++) {
        // Enforce clicks is boolean
        clicks[i] * (1 - clicks[i]) === 0;

        // RNG: Generate pseudo-random value for this step
        hash[i] = Poseidon(2);
        hash[i].inputs[0] <== seed;
        hash[i].inputs[1] <== i;
        
        // Convert Hash to Bits 
        n2b[i] = Num2Bits(254);
        n2b[i].in <== hash[i].out;
        
        // Take lowest 8 bits as Random Byte (0-255)
        var rb = 0;
        for (var j = 0; j < 8; j++) {
            rb += n2b[i].out[j] * (2 ** j); 
        }
        randByte[i] <== rb;

        // Is Green? (< 153)
        ltGreen[i] = LessThan(8);
        ltGreen[i].in[0] <== randByte[i];
        ltGreen[i].in[1] <== 153;
        isGreen[i] <== ltGreen[i].out;

        // Is Yellow? result (< 230)
        ltYellow[i] = LessThan(8);
        ltYellow[i].in[0] <== randByte[i];
        ltYellow[i].in[1] <== 230;
        
        // Logic: Yellow if (< 230) AND (NOT Green)
        isYellow[i] <== ltYellow[i].out * (1 - isGreen[i]);

        // Red: NOT Yellow AND NOT Green (i.e. >= 230)
        isRed[i] <== 1 - isGreen[i] - isYellow[i];

        // Points
        points[i] <== (isGreen[i] * 1) + (isYellow[i] * 3) + (isRed[i] * 5);

        // Accumulate Score
        internalScore[i+1] <== internalScore[i] + (clicks[i] * points[i]);
    }

    score <== internalScore[MAX_STEPS];
}

component main = Game(120);
