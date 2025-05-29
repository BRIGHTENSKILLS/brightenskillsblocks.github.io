// State variables
let currentZoom = 1;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;

let timerStartTime = Date.now();
const keyState = new Map();

let workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox')
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeDragAndDrop();
    initializeKeyboardHandling();
    initializeMouseHandling();
    initializeBlockCategories();
    initializeStageControls();
    initializeZoomControls();
    updateSpriteInfo();
});

// Drag and Drop functionality
function initializeDragAndDrop() {
    const blocks = document.querySelectorAll('.block');
    const dropZone = document.querySelector('.drop-zone');

    blocks.forEach(block => {
        block.addEventListener('dragstart', handleDragStart);
        block.addEventListener('dragend', handleDragEnd);
    });

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const blockId = e.dataTransfer.getData('text/plain');
    const block = document.getElementById(blockId);
    const dropZone = e.currentTarget;
    
    dropZone.classList.remove('drag-over');
    dropZone.appendChild(block);
}

// Block Categories
function initializeBlockCategories() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const blockCategories = document.querySelectorAll('.block-category');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show selected category
            blockCategories.forEach(cat => {
                if (cat.id === category) {
                    cat.classList.remove('hidden');
                } else {
                    cat.classList.add('hidden');
                }
            });
        });
    });
}

// Stage Controls
function initializeStageControls() {
    const greenFlag = document.querySelector('.green-flag');
    const stopButton = document.querySelector('.stop-all');

    greenFlag.addEventListener('click', startProgram);
    stopButton.addEventListener('click', stopProgram);
}

function startProgram() {
    const blocks = document.querySelectorAll('.drop-zone .block');
    blocks.forEach(block => {
        executeBlock(block);
    });
}

function stopProgram() {
    // Reset sprite position and state
    const sprite = document.querySelector('.sprite');
    sprite.style.transform = 'translate(-50%, -50%)';
    updateSpriteInfo();
}

// Zoom Controls
function initializeZoomControls() {
    const zoomIn = document.querySelector('.zoom-in');
    const zoomOut = document.querySelector('.zoom-out');
    const resetZoom = document.querySelector('.reset-zoom');

    zoomIn.addEventListener('click', () => zoomIn());
    zoomOut.addEventListener('click', () => zoomOut());
    resetZoom.addEventListener('click', () => resetZoom());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch(e.key) {
                case '+':
                    e.preventDefault();
                    zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    resetZoom();
                    break;
            }
        }
    });
}

function zoomIn() {
    if (currentZoom < MAX_ZOOM) {
        currentZoom += ZOOM_STEP;
        updateZoom();
    }
}

function zoomOut() {
    if (currentZoom > MIN_ZOOM) {
        currentZoom -= ZOOM_STEP;
        updateZoom();
    }
}

function resetZoom() {
    currentZoom = 1;
    updateZoom();
}

function updateZoom() {
    const stage = document.querySelector('.stage');
    const zoomLevel = document.querySelector('.zoom-level');
    
    stage.style.transform = `scale(${currentZoom})`;
    zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
}

// Mouse Handling
function initializeMouseHandling() {
    const stage = document.querySelector('.stage');

    stage.addEventListener('mousemove', (e) => {
        const rect = stage.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    stage.addEventListener('mousedown', () => {
        isMouseDown = true;
    });

    stage.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    stage.addEventListener('mouseleave', () => {
        isMouseDown = false;
    });
}

// Keyboard Handling
function initializeKeyboardHandling() {
    document.addEventListener('keydown', (e) => {
        keyState.set(e.key, true);
    });

    document.addEventListener('keyup', (e) => {
        keyState.set(e.key, false);
    });
}

function isKeyPressed(key) {
    return keyState.get(key) || false;
}

// Block Execution
function executeBlock(block) {
    const type = block.dataset.type;
    const sprite = document.querySelector('.sprite');
    let x = parseInt(sprite.style.left) || 240;
    let y = parseInt(sprite.style.top) || 180;
    let rotation = parseInt(sprite.style.transform.replace(/[^\d-]/g, '')) || 0;

    switch(type) {
        case 'move':
            const steps = parseInt(block.dataset.steps) || 10;
            x += steps * Math.cos(rotation * Math.PI / 180);
            y += steps * Math.sin(rotation * Math.PI / 180);
            sprite.style.left = `${x}px`;
            sprite.style.top = `${y}px`;
            break;

        case 'turn-right':
            rotation += parseInt(block.dataset.degrees) || 15;
            sprite.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
            break;

        case 'turn-left':
            rotation -= parseInt(block.dataset.degrees) || 15;
            sprite.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
            break;

        case 'say':
            const message = block.dataset.message || 'Hello!';
            showSpeechBubble(message, 'say');
            break;

        case 'think':
            const thought = block.dataset.message || 'Hmm...';
            showSpeechBubble(thought, 'think');
            break;

        case 'wait':
            const seconds = parseInt(block.dataset.seconds) || 1;
            return new Promise(resolve => setTimeout(resolve, seconds * 1000));

        case 'repeat':
            const times = parseInt(block.dataset.times) || 10;
            const childBlocks = block.querySelectorAll('.block');
            for (let i = 0; i < times; i++) {
                childBlocks.forEach(child => executeBlock(child));
            }
            break;

        case 'forever':
            const foreverBlocks = block.querySelectorAll('.block');
            setInterval(() => {
                foreverBlocks.forEach(child => executeBlock(child));
            }, 100);
            break;

        case 'if':
            const condition = block.dataset.condition;
            const ifBlocks = block.querySelectorAll('.block');
            if (evaluateCondition(condition)) {
                ifBlocks.forEach(child => executeBlock(child));
            }
            break;

        case 'mouse-down':
            return isMouseDown;

        case 'mouse-x':
            return mouseX;

        case 'mouse-y':
            return mouseY;

        case 'key-pressed':
            const key = block.dataset.key;
            return isKeyPressed(key);

        case 'timer':
            return getTimer();

        case 'reset-timer':
            resetTimer();
            break;
    }

    updateSpriteInfo();
}

function evaluateCondition(condition) {
    switch(condition) {
        case 'mouse-down':
            return isMouseDown;
        case 'key-pressed':
            return isKeyPressed(condition.key);
        default:
            return false;
    }
}

function showSpeechBubble(message, type) {
    const sprite = document.querySelector('.sprite');
    const bubble = document.createElement('div');
    bubble.className = `speech-bubble ${type}`;
    bubble.textContent = message;
    
    sprite.appendChild(bubble);
    
    setTimeout(() => {
        bubble.remove();
    }, 2000);
}

function updateSpriteInfo() {
    const sprite = document.querySelector('.sprite');
    const x = parseInt(sprite.style.left) || 240;
    const y = parseInt(sprite.style.top) || 180;
    const rotation = parseInt(sprite.style.transform.replace(/[^\d-]/g, '')) || 0;

    document.querySelector('.x-coord').textContent = Math.round(x);
    document.querySelector('.y-coord').textContent = Math.round(y);
    document.querySelector('.direction').textContent = Math.round(rotation);
}

function getTimer() {
    return (Date.now() - timerStartTime) / 1000;
}

function resetTimer() {
    timerStartTime = Date.now();
}

// Define custom blocks
Blockly.defineBlocksWithJsonArray([
  {
    "type": "move_forward",
    "message0": "move %1 steps",
    "args0": [
      {
        "type": "field_number",
        "name": "STEPS",
        "value": 10
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 210,
    "tooltip": "Move forward",
    "helpUrl": ""
  },
  {
    "type": "turn_right",
    "message0": "turn right %1 degrees",
    "args0": [
      {
        "type": "field_angle",
        "name": "DEGREES",
        "angle": 15
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 210,
    "tooltip": "Turn right",
    "helpUrl": ""
  },
  {
    "type": "turn_left",
    "message0": "turn left %1 degrees",
    "args0": [
      {
        "type": "field_angle",
        "name": "DEGREES",
        "angle": 15
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 210,
    "tooltip": "Turn left",
    "helpUrl": ""
  },
  {
    "type": "say",
    "message0": "say %1",
    "args0": [
      {
        "type": "field_input",
        "name": "MESSAGE",
        "text": "Hello!"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 290,
    "tooltip": "Say something",
    "helpUrl": ""
  }
]);

// Code generators
Blockly.JavaScript['move_forward'] = function(block) {
  var steps = block.getFieldValue('STEPS');
  return `move(${steps});\n`;
};
Blockly.JavaScript['turn_right'] = function(block) {
  var deg = block.getFieldValue('DEGREES');
  return `turnRight(${deg});\n`;
};
Blockly.JavaScript['turn_left'] = function(block) {
  var deg = block.getFieldValue('DEGREES');
  return `turnLeft(${deg});\n`;
};
Blockly.JavaScript['say'] = function(block) {
  var msg = block.getFieldValue('MESSAGE');
  return `say(\"${msg}\");\n`;
};

// Simulated sprite state
let sprite = { x: 0, y: 0, dir: 90, log: [] };
function move(steps) {
  let rad = sprite.dir * Math.PI / 180;
  sprite.x += Math.round(steps * Math.cos(rad));
  sprite.y += Math.round(steps * Math.sin(rad));
  sprite.log.push(`Moved to (${sprite.x}, ${sprite.y})`);
}
function turnRight(deg) {
  sprite.dir = (sprite.dir + Number(deg)) % 360;
  sprite.log.push(`Turned right to ${sprite.dir}°`);
}
function turnLeft(deg) {
  sprite.dir = (sprite.dir - Number(deg) + 360) % 360;
  sprite.log.push(`Turned left to ${sprite.dir}°`);
}
function say(msg) {
  sprite.log.push(`Says: ${msg}`);
}

// Run button handler
const runButton = document.getElementById('runButton');
const output = document.getElementById('output');
runButton.onclick = function() {
  sprite = { x: 0, y: 0, dir: 90, log: [] };
  output.textContent = '';
  const code = Blockly.JavaScript.workspaceToCode(workspace);
  try {
    eval(code);
    output.textContent = sprite.log.join('\n');
  } catch (e) {
    output.textContent = 'Error: ' + e;
  }
};
