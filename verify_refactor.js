const fs = require('fs');
const path = require('path');

const monolithPath = path.join(__dirname, 'game_monolith.js');
const newFlowPath = path.join(__dirname, '09_flow.js');

const monolithContent = fs.readFileSync(monolithPath, 'utf-8');
const newFlowContent = fs.readFileSync(newFlowPath, 'utf-8');

// A crude way to extract functions by relying on their signature.
function extractFunction(content, funcName) {
    const regex = new RegExp(`function \\s*${funcName}\\s*\\([^)]*\\)\\s*\\{`, 'g');
    let match = regex.exec(content);
    if (!match) return null;
    let start = match.index;
    let bracketCount = 0;
    let end = -1;
    let started = false;
    
    for (let i = start; i < content.length; i++) {
        if (content[i] === '{') {
            bracketCount++;
            started = true;
        } else if (content[i] === '}') {
            bracketCount--;
        }
        if (started && bracketCount === 0) {
            end = i + 1;
            break;
        }
    }
    return end !== -1 ? content.substring(start, end) : null;
}

const funcNames = ['calcScore', 'haversineDistance', 'formatTime'];

let allPassed = true;

for (let name of funcNames) {
    const oldFnStr = extractFunction(monolithContent, name);
    const newFnStr = extractFunction(newFlowContent, name);
    
    if (!oldFnStr) {
        console.log(`Function ${name} not found in old monolith!`);
        continue;
    }
    if (!newFnStr) {
        console.log(`Function ${name} not found in new flow!`);
        continue;
    }

    if (oldFnStr.trim() === newFnStr.trim()) {
        console.log(`✅ ${name}: CODE MATCHES EXACTLY`);
    } else {
        console.log(`❌ ${name}: CODE DIFFERS!`);
        console.log("OLD:");
        console.log(oldFnStr);
        console.log("NEW:");
        console.log(newFnStr);
        allPassed = false;
    }
}

if (allPassed) {
    console.log("All tested functions match perfectly between monolith and split files.");
}
