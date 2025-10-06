const SHIP_TYPES = [
  { name: "Porta-aviões", length: 5, id: "carrier" },
  { name: "Encouraçado", length: 4, id: "battleship" },
  { name: "Submarino", length: 3, id: "submarine" },
  { name: "Cruzador", length: 3, id: "cruiser" },
  { name: "Destroyer", length: 2, id: "destroyer" },
];

class ShipSetup {
  constructor() {
    this.boardSize = 10;
    this.board = this.createEmptyBoard();
    this.placedShips = [];
    this.currentShip = 0;
    this.isHorizontal = true;
    this.hoveredCells = [];
    
    this.boardElement = document.getElementById("setupBoard");
    this.shipsListElement = document.getElementById("shipsList");
    this.readyButton = document.getElementById("readyButton");
    this.rotateButton = document.getElementById("rotateButton");
    this.clearButton = document.getElementById("clearButton");
    this.randomButton = document.getElementById("randomButton");
    
    const params = new URLSearchParams(window.location.search);
    this.player1 = params.get("player1");
    this.player2 = params.get("player2");
    this.currentPlayer = params.get("current") || "player1";
    this.player1Ships = params.get("player1Ships");
    
    document.getElementById("setupPlayerName").textContent = 
      `${this.currentPlayer === "player1" ? this.player1 : this.player2} - Posicione seus navios`;
    
    this.initializeBoard();
    this.updateShipsList();
    this.attachEventListeners();
  }

  createEmptyBoard() {
    const board = [];
    for (let i = 0; i < this.boardSize; i++) {
      board[i] = [];
      for (let j = 0; j < this.boardSize; j++) {
        board[i][j] = null;
      }
    }
    return board;
  }

  initializeBoard() {
    this.boardElement.innerHTML = "";
    
    for (let row = 0; row < this.boardSize; row++) {
      const tr = document.createElement("tr");
      
      for (let col = 0; col < this.boardSize; col++) {
        const td = document.createElement("td");
        td.dataset.row = row;
        td.dataset.col = col;
        
        td.addEventListener("click", () => this.handleCellClick(row, col));
        td.addEventListener("mouseenter", () => this.handleCellHover(row, col));
        td.addEventListener("mouseleave", () => this.clearHover());
        
        tr.appendChild(td);
      }
      
      this.boardElement.appendChild(tr);
    }
  }

  handleCellClick(row, col) {
    if (this.currentShip >= SHIP_TYPES.length) return;
    
    const ship = SHIP_TYPES[this.currentShip];
    
    if (this.canPlaceShip(row, col, ship.length, this.isHorizontal)) {
      this.placeShip(row, col, ship.length, this.isHorizontal, ship);
      this.currentShip++;
      this.updateShipsList();
      this.renderBoard();
      
      if (this.currentShip >= SHIP_TYPES.length) {
        this.readyButton.disabled = false;
      }
    }
  }

  handleCellHover(row, col) {
    if (this.currentShip >= SHIP_TYPES.length) return;
    
    this.clearHover();
    const ship = SHIP_TYPES[this.currentShip];
    
    if (this.canPlaceShip(row, col, ship.length, this.isHorizontal)) {
      for (let i = 0; i < ship.length; i++) {
        const r = this.isHorizontal ? row : row + i;
        const c = this.isHorizontal ? col + i : col;
        const cell = this.boardElement.querySelector(`td[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
          cell.classList.add("ship-preview");
          this.hoveredCells.push(cell);
        }
      }
    } else {
      for (let i = 0; i < ship.length; i++) {
        const r = this.isHorizontal ? row : row + i;
        const c = this.isHorizontal ? col + i : col;
        if (r < this.boardSize && c < this.boardSize) {
          const cell = this.boardElement.querySelector(`td[data-row="${r}"][data-col="${c}"]`);
          if (cell) {
            cell.classList.add("ship-preview-invalid");
            this.hoveredCells.push(cell);
          }
        }
      }
    }
  }

  clearHover() {
    this.hoveredCells.forEach(cell => {
      cell.classList.remove("ship-preview");
      cell.classList.remove("ship-preview-invalid");
    });
    this.hoveredCells = [];
  }

  canPlaceShip(startRow, startCol, length, horizontal) {
    for (let i = 0; i < length; i++) {
      const row = horizontal ? startRow : startRow + i;
      const col = horizontal ? startCol + i : startCol;
      
      if (row >= this.boardSize || col >= this.boardSize) {
        return false;
      }
      
      if (this.board[row][col] !== null) {
        return false;
      }
    }
    return true;
  }

  placeShip(startRow, startCol, length, horizontal, ship) {
    const shipData = {
      id: ship.id,
      name: ship.name,
      length: length,
      cells: []
    };
    
    for (let i = 0; i < length; i++) {
      const row = horizontal ? startRow : startRow + i;
      const col = horizontal ? startCol + i : startCol;
      this.board[row][col] = ship.id;
      shipData.cells.push({ row, col });
    }
    
    this.placedShips.push(shipData);
  }

  renderBoard() {
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const cell = this.boardElement.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
        cell.className = "";
        
        if (this.board[row][col] !== null) {
          cell.classList.add("ship");
        }
      }
    }
  }

  updateShipsList() {
    this.shipsListElement.innerHTML = "";
    
    SHIP_TYPES.forEach((ship, index) => {
      const shipItem = document.createElement("div");
      shipItem.className = "ship-item";
      
      if (index < this.currentShip) {
        shipItem.classList.add("placed");
        shipItem.innerHTML = `<span class="ship-status">✓</span> ${ship.name} (${ship.length})`;
      } else if (index === this.currentShip) {
        shipItem.classList.add("current");
        shipItem.innerHTML = `<span class="ship-status">→</span> ${ship.name} (${ship.length})`;
      } else {
        shipItem.innerHTML = `<span class="ship-status">○</span> ${ship.name} (${ship.length})`;
      }
      
      this.shipsListElement.appendChild(shipItem);
    });
  }

  clearBoard() {
    this.board = this.createEmptyBoard();
    this.placedShips = [];
    this.currentShip = 0;
    this.readyButton.disabled = true;
    this.renderBoard();
    this.updateShipsList();
  }

  randomPlacement() {
    this.clearBoard();
    
    SHIP_TYPES.forEach(ship => {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        const horizontal = Math.random() < 0.5;
        const startRow = Math.floor(Math.random() * (horizontal ? this.boardSize : this.boardSize - ship.length + 1));
        const startCol = Math.floor(Math.random() * (horizontal ? this.boardSize - ship.length + 1 : this.boardSize));
        
        if (this.canPlaceShip(startRow, startCol, ship.length, horizontal)) {
          this.placeShip(startRow, startCol, ship.length, horizontal, ship);
          placed = true;
        }
        attempts++;
      }
    });
    
    this.currentShip = SHIP_TYPES.length;
    this.readyButton.disabled = false;
    this.renderBoard();
    this.updateShipsList();
  }

  toggleRotation() {
    this.isHorizontal = !this.isHorizontal;
    this.rotateButton.textContent = `Rotacionar: ${this.isHorizontal ? "Horizontal" : "Vertical"} (R)`;
  }

  attachEventListeners() {
    this.readyButton.addEventListener("click", () => this.handleReady());
    this.rotateButton.addEventListener("click", () => this.toggleRotation());
    this.clearButton.addEventListener("click", () => this.clearBoard());
    this.randomButton.addEventListener("click", () => this.randomPlacement());
    
    document.addEventListener("keypress", (e) => {
      if (e.key === "r" || e.key === "R") {
        this.toggleRotation();
      }
    });
  }

  handleReady() {
    const shipsData = JSON.stringify(this.placedShips);
    
    if (this.currentPlayer === "player1" && !this.player1Ships) {
      const params = new URLSearchParams({
        player1: this.player1,
        player2: this.player2,
        current: "player2",
        player1Ships: shipsData
      });
      window.location.href = `setup.html?${params.toString()}`;
    } else {
      const params = new URLSearchParams({
        player1: this.player1,
        player2: this.player2,
        player1Ships: this.player1Ships,
        player2Ships: shipsData
      });
      window.location.href = `game.html?${params.toString()}`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ShipSetup();
});
