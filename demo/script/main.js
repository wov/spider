// main.js
import DataStore from "./dataStore.js";
import Observer from "./observer.js";

const initialLeft = "0px";
const initialTop = "80vh";

let cardId = 0;


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


async function dealCards(cards) {
    const tableau = []; // 游戏区的10列
    const tempZone = []; // 暂存区
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

        // 设置卡牌的 isSelectable 属性
        card.isSelectable = isCardSelectable(tableau, card);
      }
    }
  
    return {
      tableau,
      tempZone,
    };
  }


  function updateCursorPosition(row, column) {
    const spider = document.getElementById("spider");
    const silk = document.getElementById("silk");
  
    if (row === -1) {
      spider.style.transform = `translate(-50%, -50%) translate(${column * 10 + 5}vw, 70vh)`;
    } else {
      spider.style.transform = `translate(-50%, -50%) translate(${column * 10 + 5}vw, ${row * 30}px)`;
    }
  
    // 更新蜘蛛丝位置
    silk.setAttribute("x1", `${column * 10 + 5}vw`);
    silk.setAttribute("y1", "0");
    silk.setAttribute("x2", `${column * 10 + 5}vw`);
    silk.setAttribute("y2", `${row === -1 ? "70vh" : row * 30}px`);
  }
  

  function isCardSelectable(tableau, card) {
    // 1. 只有翻开的牌才有可能是可选的，扣合的牌必定不可选。
    if (!card.isFaceUp) {
      return false;
    }
  
    const column = tableau.find((col) => col.some((c) => c.id === card.id));
    const cardIndex = column.findIndex((c) => c.id === card.id);
  
    // 2. 如果被其他牌压住，并且这个牌不是同花的，则这个牌就不可选。
    // 如果是同花的，但是压住它的牌没有比他小1 则也不可选。
    if (cardIndex < column.length - 1) {
      const cardOnTop = column[cardIndex + 1];
      if (cardOnTop.suit !== card.suit || cardValue(cardOnTop.rank) !== cardValue(card.rank) - 1) {
        return false;
      }
    }
  
    // 3. 如果没有空列的时候，当其他列最上方且翻开的没有比他大“1”，则不可选。
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
        cardElement.style.top = `${cardIndex * 10}px`;
        cardElement.style.zIndex = `${cardIndex + 1}`; // 设置 z-index
  
        // 更新卡牌的翻开状态
        cardElement.classList.toggle("face-up", card.isFaceUp);
        cardElement.classList.toggle("face-down", !card.isFaceUp);

        // 更新卡牌的可选和选中状态
        card.isSelectable = isCardSelectable(gameState.tableau, card);
        cardElement.classList.toggle("selectable", card.isSelectable);  

        cardElement.classList.toggle("selected", card.isSelected);
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
      
  }
  

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
    };
    renderInitialCards(initialGameState);
    DataStore.setData("gameState", initialGameState);
    // 绘制初始UI，所有卡牌扣合且在暂存区

    // 测试
    updateCursorPosition(5,4)
  
    // 延迟发牌
    setTimeout(async () => {
      await dealCards([...twoDecks]); // 使用解构来创建卡牌数组的副本
    }, 3000);
  }
  
