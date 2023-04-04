// main.js
import DataStore from "./dataStore.js";
import Observer from "./observer.js";

const initialLeft = "0px";
const initialTop = "80vh";

let cardId = 0;
let gameState;


// 获取按钮元素
const upButton = document.getElementById("upButton");
const downButton = document.getElementById("downButton");
const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");

const confirmMoveButton = document.getElementById("confirmMove");
const cancelMoveButton = document.getElementById("cancelMove");

// 初始化光标位置
let cursorRow = -1;
let cursorColumn = 0;

let selectedCard = null;


const dealCardsButton = document.getElementById("deal-cards");
dealCardsButton.addEventListener("click", dealCardsToTableau);


// 为按钮添加事件监听器
upButton.addEventListener("click", () => moveCursor('up'));
downButton.addEventListener("click", () => moveCursor('down'));

leftButton.addEventListener("click", () => moveCursorHorizontal('left'));
rightButton.addEventListener("click",  () => moveCursorHorizontal('right'));

confirmMoveButton.addEventListener("click", confirmMove);
cancelMoveButton.addEventListener("click", cancelMove);

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
      confirmMove();
      break;
    case "escape":
      cancelMove();
      break;
    default:
      break;
  }
});

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

      // 继续向上查找，直到找到一个可选的卡牌或者没有可选的卡牌为止
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
  } else if (direction === "down") {
    if (cursorRow < gameState.tableau[cursorColumn].length - 1) {
      const nextRow = cursorRow + 1;
      const nextCard = gameState.tableau[cursorColumn][nextRow];
      if (nextCard && isCardSelectable(gameState.tableau, nextCard)) {
        if (selectedCard) {
          selectedCard.isSelected = false;
        }
        cursorRow = nextRow;
        selectedCard = nextCard;
        selectedCard.isSelected = true;
      }
    } else {
      if (selectedCard) {
        selectedCard.isSelected = false;
      }
      cursorRow = -1;
      selectedCard = null;
    }
  }

  // 更新游标位置后，请确保更新卡牌的可移动到状态
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
    newCursorColumn = 9;
  } else if (newCursorColumn > 9) {
    newCursorColumn = 0;
  }

  if (selectedCard) {
    // 如果选中了卡牌
    let counter = 0;
    let foundValidMove = false;

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
          newCursorColumn = 9;
        } else if (newCursorColumn > 9) {
          newCursorColumn = 0;
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


function previewMove(row, column, gameState) {
  console.log('previewMove');
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
      cardElement.style.zIndex = 1000 + index;

      // 2. 更新卡牌位置以适应新列底部
      cardElement.style.left = `${column * 10}vw`;
      cardElement.style.top = `${(gameState.tableau[column].length + index) * 15}px`;
    }
  });

  // 更新光标位置，使其跟随选中卡牌的上下移动
  const numRowsInTargetColumn = gameState.tableau[column].length;
  updateCursorPosition(numRowsInTargetColumn , cursorColumn, gameState);
}



function columnHasSelectableCard(tableau, columnIndex) {
    const column = tableau[columnIndex];
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
    const fromColumnIndex = gameState.tableau.findIndex((col) => col.some((c) => c.isSelected));
    const selectedCardIndex = gameState.tableau[fromColumnIndex].findIndex((card) => card.isSelected);
    const movingCards = gameState.tableau[fromColumnIndex].splice(selectedCardIndex);

    // 添加卡牌到目标列
    gameState.tableau[cursorColumn].push(...movingCards);

    // 如果原始列顶部的卡牌是扣合的，翻开它
    if (gameState.tableau[fromColumnIndex].length > 0) {
      const topCard = gameState.tableau[fromColumnIndex][gameState.tableau[fromColumnIndex].length - 1];
      if (!topCard.isFaceUp) {
        topCard.isFaceUp = true;
      }
    }

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
    // initializeCursor(gameState);
    updateCursorPosition(-1, cursorColumn, gameState);


    // 更新卡牌被压住的状态
    updateCardCoveredStatus(gameState);
    
    const movedToRecycling = checkAndMoveSequencesToRecyclingZone(gameState);


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

    // 重新渲染卡牌
    DataStore.setData("gameState", gameState);
  }
}



// update ui
class UIUpdater extends Observer {
    update(data) {
      console.log("Data changed:", data);
      if (data.hasOwnProperty("gameState")) {
        renderCards(data.gameState);
      }
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
  };

  // 触发 gameStateInitialized 事件
  document.dispatchEvent(new CustomEvent("gameStateInitialized", { detail: { gameState } }));

  return gameState;
}


  // 发牌
  async function dealCardsToTableau() {
    // 获取游戏状态
    const gameState = DataStore.getData("gameState");
  
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
    console.log("updateCursorPosition", row, column, gameState);
  
    const spider = document.getElementById("spider");
    const silk = document.getElementById("silk");
  
    const numCardsInColumn = gameState.tableau[column].length;
  
    if (row === -1) {
      spider.style.transform = `translate(-50%, -50%) translate(${column * 10 + 5}vw, ${(numCardsInColumn * 15) + 50}px)`;
    } else {
      spider.style.transform = `translate(-50%, -50%) translate(${column * 10 + 5}vw, ${row * 15}px)`;
    }
  
    // 更新蜘蛛丝位置
    const xValue = `${column * 10 + 5}vw`;
    const y2Value = row === -1 ? `${(numCardsInColumn * 15) + 50}px` : `${row * 15}px`;
  
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
  if (selectedCard) {
    tableau.forEach((column) => {
      if (!column.some((c) => c.id === selectedCard.id)) {
        const topCard = column[column.length - 1];
        if (topCard) {
          if (
            topCard.isFaceUp &&
            cardValue(topCard.rank) === cardValue(selectedCard.rank) + 1
          ) {
            topCard.isMovableTo = true;
          } else {
            topCard.isMovableTo = false;
          }
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
  
    const cardElement = document.createElement("div");
    cardElement.innerHTML = `
      <div class="card ${card.isFaceUp ? 'face-up' : 'face-down'}" data-id="${card.id}" data-value="${card.rank}" data-suit="${card.suit}">
        <div class="front">
          <div class="value">
            <img src="./svg/${card.rank}_${color}.svg"></img>
          </div>
          <div class="suit">
            <img src="./svg/${card.suit}.svg"></img>
          </div>
          <div class="content">
            <img src="./svg/${card.suit}_${card.rank}_content.svg" />
          </div>
        </div>
        <div class="back"></div>
      </div>
    `;
  
    const cardEl = cardElement.querySelector(".card");
    cardEl.style.left = initialLeft;
    cardEl.style.top = initialTop;
    return cardEl;
  }
    
  function updateCardCoveredStatus(gameState) {
    gameState.tableau.forEach((column) => {
      column.forEach((card, cardIndex) => {
        card.isCovered = cardIndex < column.length - 1;
      });
    });
  }
  

  function renderInitialCards(gameState) {
    const cardContainer = document.getElementById("cardContainer");
  
    gameState.tempZone.forEach((card) => {
      const cardElement = renderCard(card);
      cardContainer.appendChild(cardElement);
    });
  }
  
  
  function renderCards(gameState) {
    const cardContainer = document.getElementById("cardContainer");
    const cards = Array.from(cardContainer.querySelectorAll(".card"));
  
    gameState.tableau.forEach((column, columnIndex) => {
      column.forEach((card, cardIndex) => {
        const cardElement = cards.find((el) => el.dataset.id === card.id.toString());
  
        if (!cardElement) {
          console.error("Card element not found:", card);
          return;
        }
  
        cardElement.style.left = `${columnIndex * 10}vw`;
        cardElement.style.top = `${cardIndex * 15}px`;
        cardElement.style.zIndex = `${cardIndex + 1}`; // 设置 z-index
  
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
  
    gameState.tempZone.forEach((card) => {
        const cardElement = cards.find((el) => el.dataset.id === card.id.toString());
      
        if (!cardElement) {
          console.error("Card element not found:", card);
          return;
        }
      
        cardElement.style.left = initialLeft;
        cardElement.style.top = initialTop;
        cardElement.style.zIndex = "0"; // 设置 z-index 为 0，使得暂存区的卡牌始终位于游戏区卡牌之下
    
      
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

        // 计算卡牌位置
        const recyclingZoneLeft = 80; // 可根据需要修改回收区距离左侧的百分比
        const recyclingZoneTop = 80; // 可根据需要修改回收区距离顶部的百分比
        const recyclingZoneSpacing = 1; // 可根据需要修改回收区卡牌间距的像素值

        cardElement.style.left = `${recyclingZoneLeft}vw`;
        cardElement.style.top = `${recyclingZoneTop + cardIndex * recyclingZoneSpacing}vh`;
        cardElement.style.zIndex = `${1000 + cardIndex}`; // 设置较高的 z-index 以确保回收区卡牌显示在顶部

        // 更新卡牌的翻开状态
        cardElement.classList.toggle("face-up", card.isFaceUp);
        cardElement.classList.toggle("face-down", !card.isFaceUp);

        // 移除回收区卡牌的可选、选中和可移动到状态
        cardElement.classList.remove("selectable", "selected", "movable-to");
      });

  }

  function checkAndMoveSequencesToRecyclingZone(gameState) {
    for (let i = 0; i < gameState.tableau.length; i++) {
      const column = gameState.tableau[i];
      const kingIndex = column.findIndex((card) => card.rank === "K" && card.isFaceUp);
  
      if (kingIndex !== -1) {
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
          return true;
        }
      }
    }
  
    return false;
  }
  
  
  function isGameOver(gameState) {
    return (
      gameState.tableau.every((column) => column.length === 0) &&
      gameState.tempZone.length === 0
    );
  }

  // async function initializeGameState() {
  //   return new Promise((resolve) => {
  //     // 创建2副牌，并洗牌。
  //     const deck1 = createDeck();
  //     const deck2 = createDeck();
  
  //     const twoDecks = deck1.concat(deck2);
  //     shuffle(twoDecks);
  
  //     // 将所有卡牌放入暂存区
  //     const initialGameState = {
  //       tableau: Array(10).fill().map(() => []),
  //       tempZone: twoDecks.map((card) => ({ ...card, inTempZone: true, isFaceUp: false })),
  //       recyclingZone: [], // 回收区
  //     };
  //     renderInitialCards(initialGameState);
  //     DataStore.setData("gameState", initialGameState);
  //     resolve(initialGameState);
  //   });
  // }
  
  export async function initApp() {
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
    };
    renderInitialCards(initialGameState);
    DataStore.setData("gameState", initialGameState);
    // 绘制初始UI，所有卡牌扣合且在暂存区
    await dealCards([...twoDecks]); // 使用解构来创建卡牌数组的副本
  }

  document.addEventListener("gameStateInitialized", (event) => {
    const gameState = event.detail.gameState;
    
    // 更新卡牌被压住的状态
    updateCardCoveredStatus(gameState);
    initializeCursor(gameState);
  });
  