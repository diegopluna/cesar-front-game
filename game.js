class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.hasShip = false;
    this.isHit = false;
    this.shipId = null;
  }

  getCoordinate() {
    return `${String.fromCharCode(65 + this.row)}${this.col + 1}`;
  }
}

class Ship {
  constructor(id, cells) {
    this.id = id;
    this.cells = cells;
    this.hits = 0;
  }

  hit() {
    this.hits++;
  }

  isSunk() {
    return this.hits >= this.cells.length;
  }
}

class Board {
  constructor(size = 10) {
    this.size = size;
    this.cells = [];
    this.ships = [];
    this.initializeCells();
  }

  initializeCells() {
    for (let row = 0; row < this.size; row++) {
      this.cells[row] = [];
      for (let col = 0; col < this.size; col++) {
        this.cells[row][col] = new Cell(row, col);
      }
    }
  }

  placeShip(startRow, startCol, length, horizontal) {
    const shipCells = [];
    const shipId = this.ships.length;

    for (let i = 0; i < length; i++) {
      const row = horizontal ? startRow : startRow + i;
      const col = horizontal ? startCol + i : startCol;

      if (
        row >= this.size ||
        col >= this.size ||
        this.cells[row][col].hasShip
      ) {
        return false;
      }
      shipCells.push({ row, col });
    }

    shipCells.forEach(({ row, col }) => {
      this.cells[row][col].hasShip = true;
      this.cells[row][col].shipId = shipId;
    });

    this.ships.push(new Ship(shipId, shipCells));
    return true;
  }

  placeShipsRandomly(recursionDepth = 0) {
    const maxRecursionDepth = 10;
    if (recursionDepth >= maxRecursionDepth) {
      throw new Error("Failed to place ships after maximum attempts");
    }

    const shipLengths = [5, 4, 3, 3, 2];
    const maxAttemptsPerShip = 100;

    for (const length of shipLengths) {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < maxAttemptsPerShip) {
        const horizontal = Math.random() < 0.5;
        const startRow = Math.floor(
          Math.random() * (horizontal ? this.size : this.size - length + 1)
        );
        const startCol = Math.floor(
          Math.random() * (horizontal ? this.size - length + 1 : this.size)
        );

        placed = this.placeShip(startRow, startCol, length, horizontal);
        attempts++;
      }

      if (!placed) {
        this.cells = [];
        this.ships = [];
        this.initializeCells();
        return this.placeShipsRandomly(recursionDepth + 1);
      }
    }
  }

  attack(row, col) {
    const cell = this.cells[row][col];

    if (cell.isHit) {
      return { result: "already-hit", sunk: false };
    }

    cell.isHit = true;

    if (cell.hasShip) {
      const ship = this.ships[cell.shipId];
      ship.hit();

      if (ship.isSunk()) {
        return { result: "hit", sunk: true, shipId: cell.shipId };
      }

      return { result: "hit", sunk: false };
    }

    return { result: "miss", sunk: false };
  }

  getAllShipsSunk() {
    return this.ships.every((ship) => ship.isSunk());
  }

  getShipsRemaining() {
    return this.ships.filter((ship) => !ship.isSunk()).length;
  }
}

class Player {
  constructor(name) {
    this.name = name;
    this.board = new Board();
    this.hits = 0;
  }

  getShipsRemaining() {
    return this.board.getShipsRemaining();
  }
}

class Game {
  constructor(player1Name, player2Name, player1Ships, player2Ships) {
    this.player1 = new Player(player1Name);
    this.player2 = new Player(player2Name);
    this.currentPlayer = this.player1;
    this.gameOver = false;
    this.attackHistory = [];

    if (player1Ships && player2Ships) {
      this.loadShips(this.player1.board, player1Ships);
      this.loadShips(this.player2.board, player2Ships);
    } else {
      this.player1.board.placeShipsRandomly();
      this.player2.board.placeShipsRandomly();
    }
  }

  loadShips(board, shipsData) {
    shipsData.forEach(shipData => {
      const cells = shipData.cells;
      const shipId = board.ships.length;
      
      cells.forEach(({ row, col }) => {
        board.cells[row][col].hasShip = true;
        board.cells[row][col].shipId = shipId;
      });
      
      board.ships.push(new Ship(shipId, cells));
    });
  }

  switchPlayer() {
    this.currentPlayer =
      this.currentPlayer === this.player1 ? this.player2 : this.player1;
  }

  attack(row, col) {
    if (this.gameOver) {
      return null;
    }

    const defender =
      this.currentPlayer === this.player1 ? this.player2 : this.player1;
    const attackResult = defender.board.attack(row, col);

    if (attackResult.result === "already-hit") {
      return attackResult;
    }

    const cell = defender.board.cells[row][col];
    const coordinate = cell.getCoordinate();

    if (attackResult.result === "hit") {
      this.currentPlayer.hits++;
    }

    this.attackHistory.unshift({
      player: this.currentPlayer.name,
      coordinate: coordinate,
      result: attackResult.result,
      sunk: attackResult.sunk,
    });

    if (defender.board.getAllShipsSunk()) {
      this.gameOver = true;
      attackResult.winner = this.currentPlayer.name;
    } else {
      this.switchPlayer();
    }

    return attackResult;
  }

  getCurrentPlayer() {
    return this.currentPlayer;
  }

  getDefender() {
    return this.currentPlayer === this.player1 ? this.player2 : this.player1;
  }
}

class GameUI {
  constructor() {
    this.game = null;
    this.board1Element = document.getElementById("board1");
    this.board2Element = document.getElementById("board2");
    this.attackHistoryElement = document.getElementById("attackHistory");
    this.shipsTableBody = document.getElementById("shipsTableBody");
    this.gameStatusElement = document.getElementById("gameStatus");
    this.initializeGame();
  }

  initializeGame() {
    const params = new URLSearchParams(window.location.search);
    const player1Name = params.get("player1") || "Jogador 1";
    const player2Name = params.get("player2") || "Jogador 2";
    
    let player1Ships = null;
    let player2Ships = null;
    
    try {
      const player1ShipsParam = params.get("player1Ships");
      const player2ShipsParam = params.get("player2Ships");
      
      if (player1ShipsParam) player1Ships = JSON.parse(player1ShipsParam);
      if (player2ShipsParam) player2Ships = JSON.parse(player2ShipsParam);
    } catch (e) {
      console.error("Error parsing ship data:", e);
    }

    this.game = new Game(player1Name, player2Name, player1Ships, player2Ships);

    document.getElementById("player1Name").textContent = player1Name;
    document.getElementById("player2Name").textContent = player2Name;

    this.renderBoards();
    this.updateScoreboard();
    this.updateShipsTable();
    this.updateGameStatus();

    document
      .getElementById("resetButton")
      .addEventListener("click", () => this.resetGame());
    
    const soundToggle = document.getElementById("soundToggle");
    if (soundToggle) {
      soundToggle.addEventListener("click", () => {
        const enabled = soundManager.toggle();
        soundToggle.textContent = enabled ? "Som: ON 🔊" : "Som: OFF 🔇";
      });
    }
  }

  renderBoards() {
    const currentPlayer = this.game.currentPlayer;
    const defender = this.game.getDefender();
    
    this.renderBoard(this.board1Element, currentPlayer.board, true);
    this.renderBoard(this.board2Element, defender.board, false);
  }

  renderBoard(tableElement, board, showShips, animateCell = null) {
    tableElement.innerHTML = "";

    for (let row = 0; row < board.size; row++) {
      const tr = document.createElement("tr");

      for (let col = 0; col < board.size; col++) {
        const td = document.createElement("td");
        const cell = board.cells[row][col];

        td.dataset.row = row;
        td.dataset.col = col;

        const isAnimatedCell = animateCell && animateCell.row === row && animateCell.col === col;

        if (cell.isHit) {
          if (cell.hasShip) {
            const ship = board.ships[cell.shipId];
            if (ship.isSunk()) {
              td.classList.add("hit", "sunk");
              if (isAnimatedCell) {
                td.classList.add("animate");
              } else {
                td.classList.add("no-animate");
              }
            } else {
              td.classList.add("hit");
              if (isAnimatedCell) {
                td.classList.add("animate");
              } else {
                td.classList.add("no-animate");
              }
            }
          } else {
            td.classList.add("miss");
            if (isAnimatedCell) {
              td.classList.add("animate");
            } else {
              td.classList.add("no-animate");
            }
          }
        } else if (showShips && cell.hasShip) {
          td.classList.add("ship");
        }

        if (!showShips && !cell.isHit && !this.game.gameOver) {
          td.addEventListener("click", () => this.handleAttack(row, col));
          td.classList.add("attackable");
        }

        tr.appendChild(td);
      }

      tableElement.appendChild(tr);
    }
  }

  handleAttack(row, col) {
    if (this.game.gameOver) {
      return;
    }

    const result = this.game.attack(row, col);

    if (result.result === "already-hit") {
      alert("Você já atacou esta posição!");
      return;
    }

    if (result.sunk) {
      soundManager.playSunk();
    } else if (result.result === "hit") {
      soundManager.playHit();
    } else if (result.result === "miss") {
      soundManager.playSplash();
    }

    this.renderBoardsWithAnimation(row, col);
    this.updateScoreboard();
    this.updateAttackHistory();
    this.updateShipsTable();
    this.updateGameStatus();

    if (this.game.gameOver) {
      setTimeout(() => {
        soundManager.playVictory();
        alert(`🎉 ${result.winner} venceu o jogo! 🎉`);
      }, 500);
    } else {
      this.showTurnTransition();
    }
  }

  renderBoardsWithAnimation(attackedRow, attackedCol) {
    const currentPlayer = this.game.currentPlayer;
    const defender =
      currentPlayer === this.game.player1
        ? this.game.player2
        : this.game.player1;

    this.renderBoard(this.board1Element, currentPlayer.board, true);
    this.renderBoard(this.board2Element, defender.board, false, { row: attackedRow, col: attackedCol });
  }

  showTurnTransition() {
    const nextPlayer = this.game.currentPlayer === this.game.player1 
      ? this.game.player1 
      : this.game.player2;
    
    const transitionOverlay = document.getElementById('turnTransition');
    const nextPlayerNameEl = document.getElementById('nextPlayerName');
    const timerEl = document.getElementById('transitionTimer');
    const readyButton = document.getElementById('readyButton');
    
    nextPlayerNameEl.textContent = `${nextPlayer.name.toUpperCase()} - SEU TURNO`;
    
    transitionOverlay.classList.remove('hidden');
    
    let countdown = 3;
    timerEl.textContent = countdown;
    
    const timerInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        timerEl.textContent = countdown;
      } else {
        clearInterval(timerInterval);
        timerEl.textContent = '✓';
      }
    }, 1000);
    
    const hideTransition = () => {
      clearInterval(timerInterval);
      transitionOverlay.classList.add('hidden');
      readyButton.removeEventListener('click', hideTransition);
    };
    
    readyButton.addEventListener('click', hideTransition);
    
    setTimeout(() => {
      hideTransition();
    }, 5000);
  }

  updateScoreboard() {
    document.getElementById("p1Ships").textContent =
      this.game.player1.getShipsRemaining();
    document.getElementById("p1Hits").textContent = this.game.player1.hits;

    document.getElementById("p2Ships").textContent =
      this.game.player2.getShipsRemaining();
    document.getElementById("p2Hits").textContent = this.game.player2.hits;

    const p1Score = document.getElementById("player1Score");
    const p2Score = document.getElementById("player2Score");

    p1Score.classList.remove("active");
    p2Score.classList.remove("active");

    if (!this.game.gameOver) {
      if (this.game.currentPlayer === this.game.player1) {
        p1Score.classList.add("active");
      } else {
        p2Score.classList.add("active");
      }
    }
  }

  updateAttackHistory() {
    this.attackHistoryElement.innerHTML = "";

    const maxHistory = 10;
    const history = this.game.attackHistory.slice(0, maxHistory);

    history.forEach((attack) => {
      const li = document.createElement("li");

      let resultText = "";
      if (attack.result === "hit") {
        resultText = attack.sunk ? "AFUNDOU! 🔥" : "ACERTOU! 💥";
        li.classList.add("hit-attack");
      } else {
        resultText = "Errou 💧";
        li.classList.add("miss-attack");
      }

      li.textContent = `${attack.player} atacou ${attack.coordinate} - ${resultText}`;
      this.attackHistoryElement.appendChild(li);
    });
  }

  updateShipsTable() {
    this.shipsTableBody.innerHTML = "";

    const players = [this.game.player1, this.game.player2];

    players.forEach((player) => {
      const tr = document.createElement("tr");

      const tdName = document.createElement("td");
      tdName.textContent = player.name;
      tr.appendChild(tdName);

      const tdIntact = document.createElement("td");
      tdIntact.textContent = player.getShipsRemaining();
      tr.appendChild(tdIntact);

      const tdSunk = document.createElement("td");
      tdSunk.textContent = player.board.ships.length - player.getShipsRemaining();
      tr.appendChild(tdSunk);

      this.shipsTableBody.appendChild(tr);
    });
  }

  updateGameStatus() {
    if (this.game.gameOver) {
      const winner = this.game.currentPlayer.name;
      this.gameStatusElement.textContent = `🎉 ${winner} venceu! 🎉`;
      this.gameStatusElement.style.background =
        "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)";

      document.getElementById("boardTitle1").textContent =
        "Tabuleiro - Jogador 1";
      document.getElementById("boardTitle2").textContent =
        "Tabuleiro - Jogador 2";

      this.renderBoard(this.board1Element, this.game.player1.board, true);
      this.renderBoard(this.board2Element, this.game.player2.board, true);
    } else {
      const currentPlayerName = this.game.currentPlayer.name;
      const defenderName = this.game.getDefender().name;

      this.gameStatusElement.textContent = `Vez de ${currentPlayerName} atacar!`;

      document.getElementById("boardTitle1").textContent =
        `Seu Tabuleiro (${currentPlayerName})`;
      document.getElementById("boardTitle2").textContent =
        `Atacar (${defenderName})`;
    }
  }

  resetGame() {
    if (
      confirm(
        "Tem certeza que deseja iniciar um novo jogo? O progresso atual será perdido."
      )
    ) {
      window.location.href = "index.html";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new GameUI();
});
