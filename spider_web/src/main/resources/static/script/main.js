// main.js
import DataStore from "./dataStore.js";
import Observer from "./observer.js";

const initialLeft = "0px";
const initialTop = "80vh";

let cardId = 0;
let gameState;

let cardGap = 4.4; //vw;


// 初始化光标位置
let cursorRow = -1;
let cursorColumn = 0;

let selectedCard = null;

let hasMoved = false;

let touchStartX;
let touchStartY;

// 获取按钮元素
const upButton = document.getElementById("upButton");
const downButton = document.getElementById("downButton");
const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");

const confirmMoveButton = document.getElementById("confirmMove");
const cancelMoveButton = document.getElementById("cancelMove");

const dealCardsButton = document.getElementById("deal-cards");

const giveUpButton = document.getElementById("give-up");

giveUpButton.addEventListener("click",restartGame);
dealCardsButton.addEventListener("click", dealCardsToTableau);

// 为按钮添加事件监听器
upButton.addEventListener("click", () => moveCursor('up'));
downButton.addEventListener("click", () => moveCursor('down'));

leftButton.addEventListener("click", () => moveCursorHorizontal('left'));
rightButton.addEventListener("click", () => moveCursorHorizontal('right'));

confirmMoveButton.addEventListener("click", confirmMove);
cancelMoveButton.addEventListener("click", cancelMove);

const initializeAppButton = document.getElementById("initializeApp");
initializeAppButton.addEventListener("click", initApp, { once: true });


let playedTimes = localStorage.getItem('playedTimes') || 0;
let winedTimes = localStorage.getItem('winedTimes') || 0;
let winRate = winedTimes/playedTimes || 0;

// 更新赢取次数
document.querySelector('#playedTimes').textContent = playedTimes;
document.querySelector('#winedTimes').textContent = winedTimes;
document.querySelector('#winRate').textContent =  `${parseFloat(winRate*100).toFixed(2)}%`;

// 是否显示resume
if(localStorage.getItem('gameState') ){
  const gs = JSON.parse(localStorage.getItem('gameState') )
  // console.log(gs);
  document.querySelector('#resumeGame').classList.add('show');
  document.querySelector('#step').textContent = gs.stepCount;
  document.querySelector('#resumeGame').addEventListener("click",resumeGame);
}



document.addEventListener("keydown", (event) => {
  switch (event.key.toLowerCase()) {
    case "arrowup":
    case "w":
      moveCursor("up");
      break;
    case "arrowdown":
    case "s":
      moveCursor("down");
      break;
    case "arrowleft":
    case "a":
      moveCursorHorizontal("left");
      break;
    case "arrowright":
    case "d":
      moveCursorHorizontal("right");
      break;
    case "enter":
    case "\\":
      confirmMove();
      break;
    case "escape":
      cancelMove();
      break;
    case "q":
      dealCardsToTableau();
      break;
    case "e":
      initApp();
      break;

    default:
      break;
  }
});

// 检测游戏手柄的连接
window.addEventListener("gamepadconnected", (event) => {
  console.log("A gamepad has been connected:", event.gamepad);
});

// 检测游戏手柄的断开连接
window.addEventListener("gamepaddisconnected", (event) => {
  console.log("A gamepad has been disconnected:", event.gamepad);
});

const buttonCooldown = 200;
let buttonTimestamps = {};

function isCooldownOver(buttonIndex) {
  if (!buttonTimestamps[buttonIndex]) {
    return true;
  }
  const currentTime = performance.now();
  const elapsedTime = currentTime - buttonTimestamps[buttonIndex];
  return elapsedTime > buttonCooldown;
}

function updateGamepadStatus() {
  const gamepads = navigator.getGamepads();

  for (const gamepad of gamepads) {
    if (gamepad) {
      // Switch Pro 手柄按钮索引
      const upButtonIndex = 12;
      const downButtonIndex = 13;
      const leftButtonIndex = 14;
      const rightButtonIndex = 15;
      const confirmButtonIndex = 1; // A
      const cancelButtonIndex = 0; // B
      const dealCardsButtonIndex = 4; // L


      // Switch Pro 左摇杆索引
      const leftStickXAxis = 0;
      const leftStickYAxis = 1;

      // 检测摇杆状态
      const leftStickX = gamepad.axes[leftStickXAxis];
      const leftStickY = gamepad.axes[leftStickYAxis];

      if (leftStickY < -0.5 && isCooldownOver("stickUp")) {
        moveCursor("up");
        buttonTimestamps["stickUp"] = performance.now();
      } else if (leftStickY > 0.5 && isCooldownOver("stickDown")) {
        moveCursor("down");
        buttonTimestamps["stickDown"] = performance.now();
      }

      if (leftStickX < -0.5 && isCooldownOver("stickLeft")) {
        moveCursorHorizontal("left");
        buttonTimestamps["stickLeft"] = performance.now();
      } else if (leftStickX > 0.5 && isCooldownOver("stickRight")) {
        moveCursorHorizontal("right");
        buttonTimestamps["stickRight"] = performance.now();
      }

      if (gamepad.buttons[upButtonIndex].pressed && isCooldownOver(upButtonIndex)) {
        moveCursor("up");
        buttonTimestamps[upButtonIndex] = performance.now();
      }
      if (gamepad.buttons[downButtonIndex].pressed && isCooldownOver(downButtonIndex)) {
        moveCursor("down");
        buttonTimestamps[downButtonIndex] = performance.now();
      }
      if (gamepad.buttons[leftButtonIndex].pressed && isCooldownOver(leftButtonIndex)) {
        moveCursorHorizontal("left");
        buttonTimestamps[leftButtonIndex] = performance.now();
      }
      if (gamepad.buttons[rightButtonIndex].pressed && isCooldownOver(rightButtonIndex)) {
        moveCursorHorizontal("right");
        buttonTimestamps[rightButtonIndex] = performance.now();
      }
      if (gamepad.buttons[confirmButtonIndex].pressed && isCooldownOver(confirmButtonIndex)) {
        confirmMove();
        buttonTimestamps[confirmButtonIndex] = performance.now();
      }
      if (gamepad.buttons[cancelButtonIndex].pressed && isCooldownOver(cancelButtonIndex)) {
        cancelMove();
        buttonTimestamps[cancelButtonIndex] = performance.now();
      }
      if (gamepad.buttons[dealCardsButtonIndex].pressed && isCooldownOver(dealCardsButtonIndex)) {
        dealCardsToTableau();
        buttonTimestamps[dealCardsButtonIndex] = performance.now();
      }
    }
  }
}

// 在主循环中调用 updateGamepadStatus
function gameLoop() {
  updateGamepadStatus();
  // 其他游戏循环逻辑
  requestAnimationFrame(gameLoop);
}

gameLoop();

// 开始更新游戏手柄状态
updateGamepadStatus();

// 处理函数
function moveCursor(direction) {
  gameState = DataStore.getData("gameState");

  if (direction === "up") {
    if (cursorRow === -1) {
      selectedCard = getLastSelectableCardInColumn(cursorColumn);
      cursorRow = gameState.tableau[cursorColumn].indexOf(selectedCard);
      if (selectedCard) {
        selectedCard.isSelected = true;
      }
    } else {
      let nextRow = cursorRow - 1;
      let nextCard = gameState.tableau[cursorColumn][nextRow];

      while (nextRow >= 0 && (!nextCard || !isCardSelectable(gameState.tableau, nextCard))) {
        nextRow--;
        nextCard = gameState.tableau[cursorColumn][nextRow];
      }

      if (nextCard && isCardSelectable(gameState.tableau, nextCard)) {
        if (selectedCard) {
          selectedCard.isSelected = false;
        }
        cursorRow = nextRow;
        selectedCard = nextCard;
        selectedCard.isSelected = true;
      }
    }
  } else if (direction === "down" && cursorRow !== -1) { // 添加了对 cursorRow 的检查
    let nextRow = cursorRow + 1;
    let nextCard = gameState.tableau[cursorColumn][nextRow];

    while (nextRow < gameState.tableau[cursorColumn].length && (!nextCard || !isCardSelectable(gameState.tableau, nextCard))) {
      nextRow++;
      nextCard = gameState.tableau[cursorColumn][nextRow];
    }

    if (nextCard && isCardSelectable(gameState.tableau, nextCard)) {
      if (selectedCard) {
        selectedCard.isSelected = false;
      }
      cursorRow = nextRow;
      selectedCard = nextCard;
      selectedCard.isSelected = true;
    } else {
      if (selectedCard) {
        selectedCard.isSelected = false;
      }
      cursorRow = -1;
      selectedCard = null;
    }
  }

  updateMovableToCards(gameState.tableau, selectedCard);
  updateCursorPosition(cursorRow, cursorColumn, gameState);
  DataStore.setData("gameState", gameState);
}


function moveCursorHorizontal(direction) {
  const delta = direction === "left" ? -1 : 1;
  let newCursorColumn = cursorColumn + delta;

  gameState = DataStore.getData("gameState");
  const tableau = gameState.tableau;

  // 确保新的光标列在有效范围内
  if (newCursorColumn < 0) {
    newCursorColumn = 0;
  } else if (newCursorColumn > 9) {
    newCursorColumn = 9;
  }

  if (selectedCard) {
    // 如果选中了卡牌
    let counter = 0;
    let foundValidMove = false;
    hasMoved = true;

    // 寻找可以移动到的列
    while (!foundValidMove && counter < 10) {
      const targetColumn = tableau[newCursorColumn];
      const topCard = targetColumn[targetColumn.length - 1];

      // 如果目标列为空或顶部卡牌比选中卡牌大1，则允许移动
      if (!topCard || cardValue(topCard.rank) === cardValue(selectedCard.rank) + 1) {
        foundValidMove = true;
      } else {
        newCursorColumn += delta;
        if (newCursorColumn < 0) {
          newCursorColumn = 0;
        } else if (newCursorColumn > 9) {
          newCursorColumn = 9;
        }
      }

      counter++;
    }

    if (foundValidMove) {
      cursorColumn = newCursorColumn;
      previewMove(cursorRow, cursorColumn, gameState); // 更新预览移动
    }
  } else {
    // 如果没有选中卡牌，直接移动光标
    cursorColumn = newCursorColumn;

    // 寻找可选卡牌
    let counter = 0;
    while (!columnHasSelectableCard(tableau, cursorColumn) && counter < 10) {
      cursorColumn += delta;
      if (cursorColumn < 0) {
        cursorColumn = 9;
      } else if (cursorColumn > 9) {
        cursorColumn = 0;
      }
      counter++;
    }

    if (counter < 10) {
      cursorRow = -1;
      updateCursorPosition(cursorRow, cursorColumn, gameState);
    }
  }
}

let initialCursorColumn = -1;

function handleTouchStart(event) {
  event.preventDefault();

  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;

  const touchZone = event.currentTarget;
  let columnIndex = parseInt(touchZone.dataset.columnIndex, 10);

  gameState = DataStore.getData("gameState");
  const tableau = gameState.tableau;

  if (!selectedCard) {
    // 如果没有选中卡牌，先将光标移动到当前列
    cursorColumn = columnIndex;

    // 如果当前列不可选，寻找距离点击位置最近的可选列
    if (!columnHasSelectableCard(tableau, cursorColumn)) {
      const candidateColumns = [
        (cursorColumn - 1 + 10) % 10,
        (cursorColumn + 1) % 10
      ];

      let minDistanceColumn = -1;
      let minDistance = Number.MAX_VALUE;

      for (const candidateColumn of candidateColumns) {
        if (columnHasSelectableCard(tableau, candidateColumn)) {
          const candidateColumnCenterPosition = getColumnCenterPosition(candidateColumn);
          const candidateColumnDistance = Math.abs(touchStartX - candidateColumnCenterPosition);

          // 添加一个距离阈值来确保相邻列之间的距离足够近
          if (candidateColumnDistance < minDistance && candidateColumnDistance < 0.15 * window.innerWidth) {
            minDistanceColumn = candidateColumn;
            minDistance = candidateColumnDistance;
          }
        }
      }

      if (minDistanceColumn !== -1) {
        cursorColumn = minDistanceColumn;
      } else {
        cursorColumn = -1; // 如果没有找到可选的列，将光标列设为 -1
      }
    }

    initialCursorColumn = cursorColumn;

    if (cursorColumn !== -1) {
      cursorRow = -1;
      moveCursor("up");

      updateCursorPosition(cursorRow, cursorColumn, gameState);
    }
  }
}


function getColumnCenterPosition(columnIndex) {
  const columnElement = document.querySelector(`.touchControlColumn[data-column-index="${columnIndex}"]`);
  if (columnElement) {
    const columnRect = columnElement.getBoundingClientRect();
    return columnRect.left + columnRect.width / 2;
  } else {
    return 0;
  }
}

let hasMovedHorizontally = false;

function previewMoveToColumn(column) {
  if (selectedCard) {
    // hasMoved = true; 
    cursorColumn = column;
    gameState = DataStore.getData("gameState");
    previewMove(cursorRow, cursorColumn, gameState);
  }
}

function handleTouchMove(event) {
  event.preventDefault();
  const touchMoveX = event.touches[0].clientX;
  const touchMoveY = event.touches[0].clientY;
  const deltaX = touchMoveX - touchStartX;
  const deltaY = touchMoveY - touchStartY;

  const newCursorColumn = getColumnIndexFromTouchPosition(touchMoveX, touchMoveY);
  let hasMovedToOtherColumn = false;


  if (newCursorColumn !== -1) {
    hasMovedToOtherColumn = initialCursorColumn !== newCursorColumn;
    hasMoved = hasMovedToOtherColumn;

    if (hasMovedToOtherColumn) {
      const tableau = DataStore.getData("gameState").tableau;
      const targetColumn = tableau[newCursorColumn];
      const topCard = targetColumn[targetColumn.length - 1];

      if ( selectedCard && ( !topCard || cardValue(topCard.rank) === cardValue(selectedCard.rank) + 1)) {
        previewMoveToColumn(newCursorColumn);
      }
    }
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // 水平移动
  } else if (!hasMovedToOtherColumn) {
    // 垂直移动
      if (deltaY > 40) {
        moveCursor("down");
        touchStartY = touchMoveY;
      } else if (deltaY < -5) {
        moveCursor("up");
        touchStartY = touchMoveY;
      }
  }
}

function getColumnIndexFromTouchPosition(x, y) {
  const touchZoneElements = document.querySelectorAll(".touchControlColumn");
  for (const touchZoneElement of touchZoneElements) {
    const rect = touchZoneElement.getBoundingClientRect();
    touchZoneElement.classList.remove('over');
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      touchZoneElement.classList.add('over');
      return parseInt(touchZoneElement.dataset.columnIndex, 10);
    }
  }
  return -1;
}

function handleTouchEnd(event) {
  event.preventDefault();
  hasMovedHorizontally = false;
  if(hasMoved){
    confirmMove();
  }else{
    cancelMove();
  }
  hasMoved = false;

  // 清空
  const touchZoneElements = document.querySelectorAll(".touchControlColumn");
  for (const touchZoneElement of touchZoneElements) {
    touchZoneElement.classList.remove('over');
  }

}


function previewMove(row, column, gameState) {
  // 更新光标位置
  cursorRow = row;
  cursorColumn = column;

  // 更新选中卡牌及其下面的卡牌的预览位置
  const fromColumnIndex = gameState.tableau.findIndex((col) => col.some((c) => c.isSelected));
  const selectedCardIndex = gameState.tableau[fromColumnIndex].findIndex((card) => card.isSelected);
  const movingCards = gameState.tableau[fromColumnIndex].slice(selectedCardIndex);

  movingCards.forEach((card, index) => {
    const cardElement = document.querySelector(`.card[data-id="${card.id}"]`);
    if (cardElement) {
      // 1. 使预览卡牌的 z-index 按顺序递增
      cardElement.style.zIndex = 1100 + index;

      // 2. 更新卡牌位置以适应新列底部
      cardElement.style.left = `${column * 10}vw`;
      cardElement.style.top = `${(gameState.tableau[column].length + index) * cardGap + 0.5}vw`;
    }
  });

  // 更新光标位置，使其跟随选中卡牌的上下移动
  const numRowsInTargetColumn = gameState.tableau[column].length;
  updateCursorPosition(numRowsInTargetColumn, cursorColumn, gameState);
}

function columnHasSelectableCard(tableau, columnIndex) {
  const column = tableau[columnIndex];

  // 如果 column 不存在或不是数组，直接返回 false
  if (!column || !Array.isArray(column)) {
    return false;
  }

  for (const card of column) {
    if (isCardSelectable(tableau, card)) {
      return true;
    }
  }
  return false;
}

function getLastSelectableCardInColumn(columnIndex) {
  const column = gameState.tableau[columnIndex];
  for (let i = column.length - 1; i >= 0; i--) {
    if (column[i].isSelectable) {
      return column[i];
    }
  }
  return null;
}

function confirmMove() {
  if (selectedCard) {
    // 如果用户没有移动过，查找最佳目标列
    if (!hasMoved) {
      const bestTargetColumn = findBestTargetColumn(gameState);
      if (bestTargetColumn !== -1) {
        // 将选择的卡牌和下面的队列移动到最佳目标列
        moveSelectedCardsToColumn(gameState, bestTargetColumn);
        // 将光标移动到最佳目标列
        cursorColumn = bestTargetColumn;
        cursorRow = gameState.tableau[bestTargetColumn].length - 1;
      }
    }

    const fromColumnIndex = gameState.tableau.findIndex((col) => col.some((c) => c.isSelected));
    const selectedCardIndex = gameState.tableau[fromColumnIndex].findIndex((card) => card.isSelected);
    const movingCards = gameState.tableau[fromColumnIndex].splice(selectedCardIndex);

    // 添加卡牌到目标列
    gameState.tableau[cursorColumn].push(...movingCards);

    // 如果原始列顶部的卡牌是扣合的，翻开它
    gameState.tableau.forEach((column) => {
      if (column.length > 0) {
        const lastCard = column[column.length - 1];
        if (!lastCard.isFaceUp) {
          lastCard.isFaceUp = true;
        }
      }
    });

    // 取消选中的卡牌
    movingCards.forEach((card) => {
      card.isSelected = false;
    });
    selectedCard = null;

    // 清除所有卡牌的 "isMovableTo" 属性
    gameState.tableau.flat().forEach((card) => {
      card.isMovableTo = false;
    });

    // 初始化光标位置
    cursorRow = -1;
    updateCursorPosition(cursorRow, cursorColumn, gameState);

    // 更新卡牌被压住的状态
    updateCardCoveredStatus(gameState);

    // 计算是否要移动到回收区
    const movedToRecycling = checkAndMoveSequencesToRecyclingZone(gameState);

    // 更新可能可以翻开的花色
    const possibleSuitSequences = countPossibleSuitSequences(gameState.tableau);
    gameState.possibleSuitSequences = possibleSuitSequences;

    hasMoved = false;

    gameState.stepCount += 1;
    // 重新渲染卡牌

    DataStore.setData("gameState", gameState);
  }
}


function cancelMove() {
  if (selectedCard) {
    // 清除所有卡牌的 "isMovableTo" 属性
    gameState.tableau.flat().forEach((card) => {
      card.isMovableTo = false;
    });

    // 重新设置光标位置
    cursorRow = -1;
    cursorColumn = gameState.tableau.findIndex((col) => col.some((c) => c.id === selectedCard.id));

    // 取消选中的卡牌
    selectedCard.isSelected = false;
    selectedCard = null;

    // 更新光标位置
    updateCursorPosition(cursorRow, cursorColumn, gameState);

    hasMoved = false;
    // 重新渲染卡牌
    DataStore.setData("gameState", gameState);
  }
}

function moveSelectedCardsToColumn(gameState, targetColumn) {
  const fromColumnIndex = gameState.tableau.findIndex((col) => col.some((c) => c.isSelected));
  const selectedCardIndex = gameState.tableau[fromColumnIndex].findIndex((card) => card.isSelected);
  const movingCards = gameState.tableau[fromColumnIndex].splice(selectedCardIndex);

  // 添加卡牌到目标列
  gameState.tableau[targetColumn].push(...movingCards);

  // 更新卡牌位置以适应新列底部
  movingCards.forEach((card, index) => {
    const cardElement = document.querySelector(`.card[data-id="${card.id}"]`);
    if (cardElement) {
      // 1. 使卡牌的 z-index 按顺序递增
      cardElement.style.zIndex = 1000 + index;

      // 2. 更新卡牌位置以适应新列底部
      cardElement.style.left = `${targetColumn * 10}vw`;
      cardElement.style.top = `${(gameState.tableau[targetColumn].length - movingCards.length + index) * 15}px`;
    }
  });
}



function findBestTargetColumn(gameState) {
  const fromColumnIndex = gameState.tableau.findIndex((col) => col.some((c) => c.isSelected));
  const selectedCard = gameState.tableau[fromColumnIndex].find((card) => card.isSelected);

  // 优先级 1：同色并且大于1的牌
  const sameColorHigherRankColumns = gameState.tableau
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => {
      if (column.length === 0) return false;
      const lastCard = column[column.length - 1];
      return (
        lastCard.suit === selectedCard.suit &&
        cardValue(lastCard.rank) === cardValue(selectedCard.rank) + 1
      );
    });

  if (sameColorHigherRankColumns.length > 0) {
    return sameColorHigherRankColumns[0].index;
  }

  // 优先级 2：大于1的牌
  const higherRankColumns = gameState.tableau
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => {
      if (column.length === 0) return false;
      const lastCard = column[column.length - 1];
      return cardValue(lastCard.rank) === cardValue(selectedCard.rank) + 1;
    });

  if (higherRankColumns.length > 0) {
    return higherRankColumns[0].index;
  }

  // 优先级 3：空列
  const emptyColumnIndex = gameState.tableau.findIndex((column) => column.length === 0);
  if (emptyColumnIndex !== -1) {
    return emptyColumnIndex;
  }

  return -1; // 没有找到合适的列
}


// update ui
class UIUpdater extends Observer {
  update(data) {
    // console.log("Data changed:", data);
    if (data.hasOwnProperty("gameState")) {

      // 存到localstorage中。
      localStorage.setItem('gameState',JSON.stringify(data.gameState));

      renderCards(data.gameState);

      // 计算各区域的卡牌数量
      let tableauFaceDownCount = 0;
      let tableauFaceUpCount = 0;

      data.gameState.tableau.forEach((column) => {
        column.forEach((card) => {
          if (card.isFaceUp) {
            tableauFaceUpCount++;
          } else {
            tableauFaceDownCount++;
          }
        });
      });


      // 更新显示的卡牌数量
      // document.getElementById("tableauFaceDownCount").textContent = tableauFaceDownCount;
      // document.getElementById("tableauFaceUpCount").textContent = tableauFaceUpCount;

      // 更新步数
      document.getElementById("stepCount").textContent = `Step count: ${data.gameState.stepCount}`;

      const possibleSuitSequences = countPossibleSuitSequences(data.gameState.tableau);
      data.gameState.possibleSuitSequences = possibleSuitSequences;

      // 使用辅助函数将花色名称转换为对应的 emoji
      // const possibleSuitSequencesEmoji = possibleSuitSequences.map(suitToEmoji);

      // 比较新旧状态的 possibleSuitSequences 并找出新加入的值
      const newSequences = possibleSuitSequences.filter(
        (sequence) => !this.previousSuitSequences.includes(sequence)
      );

      if (newSequences.length > 0) {
        newSequences.forEach(suit => {
          const iconElement = document.querySelector(`.${suit}placeholder .icon`);
          // 为每个新花色添加动画
          iconElement.style.animation = 'scaleup-and-down 1s ease-in-out';
          iconElement.addEventListener('animationend', function() {
            this.style.animation = '';
          });
        });
      }
  
      
      // 更新UI中的可能花色序列计数
      // 先移除class。
      const suitplaceholders = document.querySelectorAll('.suitplaceholder');
      suitplaceholders.forEach( s => {
        s.classList.remove('active');
      });

      // 再添加class- active
      possibleSuitSequences.map( suit => {
        const cn = `.${suit}placeholder`;
        document.querySelector(cn).classList.add('active');
      });

      
      // 更新 previousSuitSequences 以便下次比较
      this.previousSuitSequences = possibleSuitSequences;

      const isgameover = isGameOver(data.gameState);

      if(isgameover){
        // 记录胜利次数
        winedTimes = parseInt(winedTimes);
        winedTimes++;
        localStorage.setItem('winedTimes',winedTimes);
        // 清空缓存
        localStorage.removeItem("gameState");
        alert(`You Win! /n your step is :  ${data.gameState.stepCount}`)
      }

    }
  }
}


function suitToEmoji(suit) {
  switch (suit) {
    case "spade":
      return "♠️";
    case "club":
      return "♣️";
    case "heart":
      return "♥️";
    case "diamond":
      return "♦️";
    default:
      return "";
  }
}


function createDeck() {
  const suits = ["spade", "club", "diamond", "heart"];
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const deck = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: cardId++,
        suit,
        rank,
        inTempZone: true, // 是否在暂存区
        isFaceUp: false, // 是否翻开
        isSelectable: false, // 是否可选
        isSelected: false, // 是否被选中
        isMovableTo: false, // 是否可被移动到
        isCovered: false, // 是否被压住
      });
    }
  }
  return deck;
}


function shuffle(cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
}

// 第一次发牌，初始化游戏
async function dealCards(cards) {
  const tableau = []; // 游戏区的10列
  const tempZone = []; // 暂存区
  const recyclingZone = []; // 回收区
  const numColumns = 10;
  const possibleSuitSequences = []; // 有没有可回收的花色


  // 初始化游戏区
  for (let i = 0; i < numColumns; i++) {
    tableau[i] = [];
  }

  // 将剩余卡牌放入暂存区
  while (cards.length > 0) {
    const card = cards.pop();
    card.inTempZone = true;
    tempZone.push(card);
  }

  // 发牌到游戏区
  for (let j = 0; j < 6; j++) {
    for (let i = 0; i < numColumns; i++) {
      if (j === 5 && i >= 4) continue; // 只有前4列有6张牌
      const card = tempZone.pop();
      if (j === (i < 4 ? 5 : 4)) {
        card.isFaceUp = true;
      }
      tableau[i].push(card);

      // 设置 gameState
      const gameState = {
        tableau,
        tempZone,
        recyclingZone,
        stepCount: 0, // 初始化步数为 0
        possibleSuitSequences,
      };
      DataStore.setData("gameState", gameState);

      // 等待 50 毫秒后，将卡牌从暂存区移到游戏区
      await new Promise((resolve) => {
        setTimeout(() => {
          card.inTempZone = false;
          card.processing = false;
          DataStore.setData("gameState", gameState);
          resolve();
        }, 50);
      });
    }
  }

  // 更新卡牌的 isSelectable 属性
  for (let column of tableau) {
    for (let card of column) {
      card.isSelectable = isCardSelectable(tableau, card);
    }
  }

  const gameState = {
    tableau,
    tempZone,
    recyclingZone,
    stepCount: 0, // 初始化步数为 0,
    possibleSuitSequences,
  };

  // 触发 gameStateInitialized 事件
  document.dispatchEvent(new CustomEvent("gameStateInitialized", { detail: { gameState } }));

  return gameState;
}


// 发牌
async function dealCardsToTableau() {
  // 获取游戏状态
  const gameState = DataStore.getData("gameState");

  if(!gameState){return;}

  // 将暂存区中的前 10 张牌分发到游戏区的每一列
  for (let i = 0; i < 10; i++) {
    if (gameState.tempZone.length === 0) {
      break;
    }
    const card = gameState.tempZone.pop();

    // 翻开卡牌
    card.isFaceUp = true;

    // 将卡牌添加到对应列的顶部
    gameState.tableau[i].push(card);

    const movedToRecycling = checkAndMoveSequencesToRecyclingZone(gameState);

    // 更新游戏状态
    DataStore.setData("gameState", gameState);
    // 在这里添加更新 DOM 的代码，以显示新的游戏状态
    // 您可以根据需要调用自定义的渲染函数
    // 更新卡牌被压住的状态
    updateCardCoveredStatus(gameState);
    initializeCursor(gameState);
    
   // 在每次发牌之间添加 100ms 的延迟
   await new Promise((resolve) => setTimeout(resolve, 100));
  }
}


function updateCursorPosition(row, column, gameState) {
  const spider = document.getElementById("spider");
  const silk = document.getElementById("silk");

  const numCardsInColumn = gameState.tableau[column].length;

  if (row === -1) {
    spider.style.transform = `translate(-50%, -50%) translate(${column * 10 + 5}vw, ${(numCardsInColumn * cardGap) + 11}vw)`;
  } else {
    spider.style.transform = `translate(-50%, -50%) translate(${column * 10 + 5}vw, ${row * cardGap}vw)`;
  }

  // 更新蜘蛛丝位置
  const xValue = `${column * 10 + 5}vw`;
  const y2Value = row === -1 ? `${(numCardsInColumn * cardGap) + 11}vw` : `${row * cardGap}vw`;

  silk.style.left = xValue;
  silk.style.height = y2Value;
}

function initializeCursor(gameState) {
  const tableau = gameState.tableau;
  let foundSelectableColumn = false;

  for (let i = 0; i < 10; i++) {
    if (columnHasSelectableCard(tableau, i)) {
      cursorColumn = i;
      foundSelectableColumn = true;
      break;
    }
  }

  // 如果没有可选牌的列，则将光标设置为第一列下方
  if (!foundSelectableColumn) {
    cursorColumn = 0;
  }

  cursorRow = -1;
  updateCursorPosition(cursorRow, cursorColumn, gameState);
}



function isCardSelectable(tableau, card) {
  // 1. 只有翻开的牌才有可能是可选的，扣合的牌必定不可选。
  if (!card.isFaceUp || card.isSelected) {
    return false;
  }

  const column = tableau.find((col) => col.some((c) => c.id === card.id));
  const cardIndex = column.findIndex((c) => c.id === card.id);

  // 检查其他列中是否有选中的卡牌
  for (const otherColumn of tableau) {
    if (otherColumn !== column && otherColumn.some((c) => c.isSelected)) {
      return false;
    }
  }

  // 2. 如果被其他牌压住，并且这个牌不是同花的，则这个牌就不可选。
  // 如果是同花的，但是压住它的牌没有比他小1 则也不可选。
  if (cardIndex < column.length - 1) {
    const cardOnTop = column[cardIndex + 1];
    if (cardOnTop.suit !== card.suit || cardValue(cardOnTop.rank) !== cardValue(card.rank) - 1) {
      return false;
    }

    // 3. 如果被其他牌压住，则确保选中卡牌下方的所有卡牌花色相同且依次减小。
    if (cardIndex < column.length - 1) {
      for (let i = cardIndex + 1; i < column.length; i++) {
        const currentCard = column[i];

        // 如果当前卡牌的花色与选中卡牌的花色不同，则返回 false
        if (currentCard.suit !== card.suit) {
          return false;
        }

        // 如果当前卡牌不是最后一张卡牌，检查当前卡牌与下一张卡牌的等级是否依次递减
        if (i < column.length - 1) {
          const nextCard = column[i + 1];
          if (cardValue(currentCard.rank) - 1 !== cardValue(nextCard.rank)) {
            return false;
          }
        }
      }
    }

  }

  // 4. 如果没有空列的时候，当其他列最上方且翻开的没有比他大“1”，则不可选。
  // 如果有空列的时候则可选。
  const hasEmptyColumn = tableau.some((col) => col.length === 0);
  if (!hasEmptyColumn) {
    const otherColumns = tableau.filter((col) => !col.some((c) => c.id === card.id));
    const noGreaterCard = otherColumns.every((col) => {
      const topCard = col[col.length - 1];
      return !topCard.isFaceUp || cardValue(topCard.rank) !== cardValue(card.rank) + 1;
    });
    if (noGreaterCard) {
      return false;
    }
  }

  return true;
}


function updateMovableToCards(tableau, selectedCard) {
  const movableToColumns = [];

  if (selectedCard) {
    tableau.forEach((column, columnIndex) => {
      if (!column.some((c) => c.id === selectedCard.id)) {
        const topCard = column[column.length - 1];
        if (topCard) {
          if (
            topCard.isFaceUp &&
            cardValue(topCard.rank) === cardValue(selectedCard.rank) + 1
          ) {
            topCard.isMovableTo = true;
            movableToColumns.push(columnIndex);
          } else {
            topCard.isMovableTo = false;
          }
        } else {
          // 如果列为空，将其添加到可移动到的列数组中
          movableToColumns.push(columnIndex);
        }
      }
    });
  } else {
    tableau.forEach((column) => {
      const topCard = column[column.length - 1];
      if (topCard) {
        topCard.isMovableTo = false;
      }
    });
  }
  return movableToColumns;
}

// 辅助函数，将卡牌等级转换为数字，以便于比较大小
function cardValue(rank) {
  if (rank === "A") {
    return 1;
  } else if (rank === "K") {
    return 13;
  } else if (rank === "Q") {
    return 12;
  } else if (rank === "J") {
    return 11;
  } else {
    return parseInt(rank, 10);
  }
}


function renderCard(card) {
  const isRed = card.suit === "diamond" || card.suit === "heart";
  const color = isRed ? "red" : "black";

  const dealCardsBtn = document.querySelector('.deal-cards-btn');
  const rect = dealCardsBtn.getBoundingClientRect();
  const _top = rect.top;

  const cardElement = document.createElement("div");
  cardElement.innerHTML = `
      <div class="card ${card.isFaceUp ? 'face-up' : 'face-down'}" data-id="${card.id}" data-value="${card.rank}" data-suit="${card.suit}">
        <div class="front">
          <div class="value">
            <img src="../static/svg/${card.rank}_${color}.svg"></img>
          </div>
          <div class="suit">
            <img src="../static/svg/${card.suit}.svg"></img>
          </div>
          <div class="content">
            <img src="../static/svg/${card.suit}_${card.rank}_content.svg" />
          </div>
        </div>
        <div class="back"></div>
      </div>
    `;

  const cardEl = cardElement.querySelector(".card");
  cardEl.style.left = '5px';
  cardEl.style.top = `${_top + 5}px`;

  return cardEl;
}

function updateCardCoveredStatus(gameState) {
  gameState.tableau.forEach((column) => {
    column.forEach((card, cardIndex) => {
      card.isCovered = cardIndex < column.length - 1;
    });
  });
  DataStore.setData("gameState", gameState);

}

function renderInitialCards(gameState) {
  const cardContainer = document.getElementById("cardContainer");
  const touchControlContainer = document.getElementById("touchControlContainer");

  gameState.tempZone.forEach((card) => {
    const cardElement = renderCard(card);
    cardContainer.appendChild(cardElement);
  });

  for (let i = 0; i < 10; i++) {
    const xOffset = 10; // 你可以根据需要调整每个堆之间的间距
    const touchControlColumn = document.createElement("div");
    touchControlColumn.id = `touchControlColumn-${i}`;
    touchControlColumn.classList.add("touchControlColumn");
    touchControlColumn.style.left = `calc(${initialLeft} + ${i * xOffset}vw)`;
    touchControlColumn.dataset.columnIndex = i; 

    touchControlColumn.addEventListener("touchstart", handleTouchStart);
    touchControlColumn.addEventListener("touchmove", handleTouchMove);
    touchControlColumn.addEventListener("touchend", handleTouchEnd);

    touchControlContainer.appendChild(touchControlColumn);
  }
}

function renderCards(gameState) {
  const cardContainer = document.getElementById("cardContainer");
  const cards = Array.from(cardContainer.querySelectorAll(".card"));

  // 游戏区的卡牌
  gameState.tableau.forEach((column, columnIndex) => {
    column.forEach((card, cardIndex) => {
      const cardElement = cards.find((el) => el.dataset.id === card.id.toString());

      if (!cardElement) {
        console.error("Card element not found:", card);
        return;
      }

      cardElement.style.left = `${columnIndex * 10}vw`;
      cardElement.style.top = `${cardIndex * cardGap + 0.5}vw`;
      cardElement.style.zIndex = `${cardIndex + 1001}`; // 设置 z-index


      // 更新卡牌的翻开状态
      cardElement.classList.toggle("face-up", card.isFaceUp);
      cardElement.classList.toggle("face-down", !card.isFaceUp);

      // 更新卡牌的可选和选中状态
      card.isSelectable = isCardSelectable(gameState.tableau, card);
      cardElement.classList.toggle("selectable", card.isSelectable);

      cardElement.classList.toggle("selected", card.isSelected);

      // 更新卡牌的可移动到状态
      cardElement.classList.toggle("movable-to", card.isMovableTo);

      // 根据卡牌的 isCovered 属性，添加或移除 'covered' 类名
      cardElement.classList.toggle('covered', card.isCovered);
    });
  });

  // 暂存区的卡牌
  gameState.tempZone.forEach((card, index) => {
    const cardElement = cards.find((el) => el.dataset.id === card.id.toString());
    const dealCardsBtn = document.querySelector('.deal-cards-btn');
    const rect = dealCardsBtn.getBoundingClientRect();
    const _top = rect.top;

  
    if (!cardElement) {
      console.error("Card element not found:", card);
      return;
    }
  
    // 如果暂存区卡牌数量小于等于50，按照要求设置卡牌位置
    if (gameState.tempZone.length <= 50) {
      const stackIndex = Math.floor(index / 10);
      const cardIndexInStack = index % 10;
      const xOffset = 10.1; // 你可以根据需要调整每个堆之间的间距
      const yOffset = 0.5; // 每张卡片在堆中的垂直间距

      cardElement.style.left = `calc(${initialLeft} + ${stackIndex * xOffset}vw + 5px)`;
      cardElement.style.top = `calc(${_top + 5 + cardIndexInStack * yOffset}px)`;

      cardElement.style.zIndex = `${1000+cardIndexInStack}`; // 设置 z-index 
    }
  
    // 更新卡牌的翻开状态
    card.isSelectable = isCardSelectable(gameState.tableau, card);
    cardElement.classList.toggle("selectable", card.isSelectable);
    cardElement.classList.toggle("selected", card.isSelected);
  
    cardElement.classList.toggle("face-up", card.isFaceUp);
    cardElement.classList.toggle("face-down", !card.isFaceUp);
  });
  
  // 渲染回收区的卡牌
  gameState.recyclingZone.forEach((card, cardIndex) => {
    const cardElement = cards.find((el) => el.dataset.id === card.id.toString());

    if (!cardElement) {
      console.error("Card element not found:", card);
      return;
    }

    const suit = card.suit;
    const blockContainer = document.querySelector(`.${suit}placeholder .block`);

    const rect = blockContainer.getBoundingClientRect();
    const left = rect.left;
    const top = rect.top;

    // 计算卡牌位置
    const stacks = 8;
    const stackIndex = cardIndex % stacks;
    const cardInStackIndex = Math.floor(cardIndex / stacks);

    cardElement.style.left = `${left - 0.5*cardValue(card.rank)/13 }px`;
    cardElement.style.top = `${top+ 3 - 2*cardValue(card.rank)/13 }px`;



    cardElement.style.zIndex = cardValue(card.rank); // 按卡牌的值设置z-index

    // 移除回收区卡牌的可选、选中、遮住和可移动到状态
    cardElement.classList.remove("selectable", "selected", "movable-to","covered");
    // 回收区的卡牌统一打开
    cardElement.classList.remove("face-down");
    // 添加回收区的class
    cardElement.classList.add("recycling");
  });




  const selectedCard = gameState.tableau
    .flat()
    .find((card) => card.isSelected);
  const movableToColumns = updateMovableToCards(gameState.tableau, selectedCard);

  // 渲染触控区域 
  for (let i = 0; i < 10; i++) {
    const touchControlColumn = document.getElementById(`touchControlColumn-${i}`);
    touchControlColumn.classList.toggle("selectable", columnHasSelectableCard(gameState.tableau, i));
    touchControlColumn.classList.toggle("movable-to", movableToColumns.includes(i));
  }

  // 检查游戏是否结束
  if (isGameOver(gameState)) {
    // 为每张卡片添加位移、三维旋转
    cards.forEach((cardElement, index) => {
      const { xOffset, yOffset, rotationX, rotationY, rotationZ } = randomDisplacementAndRotation3D();
      cardElement.style.transition = `all 5s cubic-bezier(0.25, 1, 0.5, 1)`;
      cardElement.style.transform = `translate(${xOffset}, ${yOffset}) rotateX(${rotationX}) rotateY(${rotationY}) rotateZ(${rotationZ}) scale(3)`;
    });
  }
}

function checkAndMoveSequencesToRecyclingZone(gameState) {
  let movedToRecycling = false;

  for (let i = 0; i < gameState.tableau.length; i++) {
    const column = gameState.tableau[i];
    const kingIndices = column.reduce((indices, card, index) => {
      if (card.rank === "K" && card.isFaceUp) {
        indices.push(index);
      }
      return indices;
    }, []);

    for (const kingIndex of kingIndices) {
      let sequenceLength = 1;

      for (let j = kingIndex + 1; j < column.length; j++) {
        const prevCard = column[j - 1];
        const currentCard = column[j];

        if (
          currentCard.isFaceUp &&
          currentCard.suit === prevCard.suit &&
          cardValue(currentCard.rank) === cardValue(prevCard.rank) - 1
        ) {
          sequenceLength++;
        } else {
          break;
        }
      }

      if (sequenceLength === 13) {
        const sequence = column.splice(kingIndex, 13);
        gameState.recyclingZone.push(...sequence);
        movedToRecycling = true;
      }
    }
  }

  // 如果有卡片被移到回收区，检查游戏区的每一列的最后一张卡片是否需要翻开
  if (movedToRecycling) {
    gameState.tableau.forEach((column) => {
      if (column.length > 0) {
        const lastCard = column[column.length - 1];
        if (!lastCard.isFaceUp) {
          lastCard.isFaceUp = true;
        }
      }
    });
  }

  return movedToRecycling;
}

function isGameOver(gameState) {
  return (
    gameState.tableau.every((column) => column.length === 0) &&
    gameState.tempZone.length === 0
  );
}


export async function initApp() {

    // 关闭欢迎界面
  const welcomePanel = document.querySelector('.welcomePanel');
  welcomePanel.classList.add('disappear');

  // 打开按钮
  const gameBtns =  document.querySelector('.game-btns');
  gameBtns.classList.add('show');


  if (DataStore.isInitialized) {
    // 应用已初始化，直接返回
    return;
  }

  // 增加游玩次数计算。
  playedTimes = parseInt(playedTimes)
  playedTimes++;
  localStorage.setItem('playedTimes',playedTimes);

  // 将 isInitialized 设置为 true，表示已完成初始化
  DataStore.isInitialized = true;


  const uiUpdater = new UIUpdater();
  DataStore.addObserver(uiUpdater);

  // 创建2副牌，并洗牌。
  const deck1 = createDeck();
  const deck2 = createDeck();

  const twoDecks = deck1.concat(deck2);
  shuffle(twoDecks);

  // 将所有卡牌放入暂存区
  const initialGameState = {
    tableau: Array(10).fill([]),
    tempZone: twoDecks.map((card) => ({ ...card, inTempZone: true, isFaceUp: false })),
    recyclingZone: [], // 回收区
    possibleSuitSequences: [], // 有没有可回收的花色
    stepCount: 0, // 初始化步数为 0
  };
  renderInitialCards(initialGameState);
  DataStore.setData("gameState", initialGameState);
  // 绘制初始UI，所有卡牌扣合且在暂存区
  await dealCards([...twoDecks]); // 使用解构来创建卡牌数组的副本

}




// Resume
function resumeGame(){
  const gameState = localStorage.getItem('gameState') && JSON.parse( localStorage.getItem('gameState') );

  // TODO: 清空可选状态。。。
  console.log(gameState)

  if(gameState){
    // 关闭欢迎界面
    const welcomePanel = document.querySelector('.welcomePanel');
    welcomePanel.classList.add('disappear');

      // 打开按钮
    const gameBtns =  document.querySelector('.game-btns');
    gameBtns.classList.add('show');
  
    if (DataStore.isInitialized) {
      // 应用已初始化，直接返回
      return;
    }

    const uiUpdater = new UIUpdater();
    DataStore.addObserver(uiUpdater);
  
    // 创建2副牌，并洗牌。
    const deck1 = createDeck();
    const deck2 = createDeck();
  
    const twoDecks = deck1.concat(deck2);
    shuffle(twoDecks);
  
    // 将所有卡牌放入暂存区
    const initialGameState = {
      tableau: Array(10).fill([]),
      tempZone: twoDecks.map((card) => ({ ...card, inTempZone: true, isFaceUp: false })),
      recyclingZone: [], // 回收区
      possibleSuitSequences: [], // 有没有可回收的花色
      stepCount: 0, // 初始化步数为 0
    };
    renderInitialCards(initialGameState);
    DataStore.setData("gameState", initialGameState);  //   const initialGameState = {
 

    DataStore.setData("gameState", gameState);
  }
}


document.addEventListener("gameStateInitialized", (event) => {
  const gameState = event.detail.gameState;

  // 更新卡牌被压住的状态
  updateCardCoveredStatus(gameState);
  initializeCursor(gameState);

});

// 生成随机位移和旋转角度
function randomDisplacementAndRotation3D() {
  const xOffset = (Math.random() * 2 - 1) * 200 + "vw";
  const yOffset = (Math.random() * 2 - 1) * 200 + "vh";
  const rotationX = (Math.random() * 2 - 1) * 720 + "deg";
  const rotationY = (Math.random() * 2 - 1) * 720 + "deg";
  const rotationZ = (Math.random() * 2 - 1) * 720 + "deg";
  return { xOffset, yOffset, rotationX, rotationY, rotationZ };
}


// 计算目前可能可以完成的花色。
function countPossibleSuitSequences(tableau) {
  const faceUpCards = tableau
    .flat()
    .filter((card) => card.isFaceUp);

  const suits = ["spade", "club", "heart", "diamond"];
  const completeSequences = [];

  suits.forEach((suit) => {
    const suitCards = faceUpCards.filter((card) => card.suit === suit);
    const rankCount = Array(13).fill(0);

    suitCards.forEach((card) => {
      rankCount[cardValue(card.rank) - 1]++;
    });

    if (rankCount.every((count) => count >= 1)) {
      completeSequences.push(suit);
    }
  });

  return completeSequences;
}

function restartGame(){
    const r = confirm('Are you sure you want to restart the game?')
    if(r){
      localStorage.removeItem("gameState");
      location.reload();
    }
}
